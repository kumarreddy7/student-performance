package com.varsha.analyticsservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Dispatches an academic notification email.
     * Uses real SMTP configurations if available. Otherwise, dynamically falls back to console logging
     * to prevent application boot or runtime exceptions in development environments.
     */
    public void sendEmail(String to, String subject, String body) {
        logger.info("====== OUTGOING EMAIL ALERTS ======");
        logger.info("Recipient: {}", to);
        logger.info("Subject: {}", subject);
        logger.info("Content:\n{}", body);
        logger.info("====================================");

        if (mailSender == null) {
            logger.warn("JavaMailSender is not configured. Email logged to console in MOCK mode.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("alerts@studentpredictor.com");
            
            mailSender.send(message);
            logger.info("Email successfully dispatched via SMTP to {}", to);
        } catch (Exception e) {
            logger.error("Failed to dispatch real SMTP email to " + to + ". System fallback: standard logging.", e);
        }
    }
}
