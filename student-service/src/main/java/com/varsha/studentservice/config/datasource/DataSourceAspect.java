package com.varsha.studentservice.config.datasource;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.lang.reflect.Method;

@Aspect
@Component
@Order(0) // Ensure aspect runs BEFORE the transaction manager initiates and grabs the connection
public class DataSourceAspect {

    @Around("execution(* com.varsha.studentservice.service..*.*(..))")
    public Object proceed(ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = getMethod(joinPoint);
        Transactional transactional = method.getAnnotation(Transactional.class);
        
        if (transactional == null) {
            // Check if class itself is annotated as transactional
            transactional = joinPoint.getTarget().getClass().getAnnotation(Transactional.class);
        }

        // If transaction is marked readOnly, route connection to the replica database
        if (transactional != null && transactional.readOnly()) {
            RoutingDataSourceContextHolder.set(DataSourceType.REPLICA);
        } else {
            RoutingDataSourceContextHolder.set(DataSourceType.PRIMARY);
        }

        try {
            return joinPoint.proceed();
        } finally {
            RoutingDataSourceContextHolder.clear();
        }
    }

    private Method getMethod(ProceedingJoinPoint joinPoint) {
        org.aspectj.lang.reflect.MethodSignature signature = (org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature();
        return signature.getMethod();
    }
}
