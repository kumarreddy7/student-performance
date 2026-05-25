import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setFormError('');
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow-xl shadow-purple-500/5 sm:rounded-2xl sm:px-10 border border-gray-100">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {formError || error ? (
          <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center">
            {formError || error}
          </div>
        ) : null}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <div className="mt-1">
            <input
              {...register('username')}
              type="text"
              className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent sm:text-sm transition-all bg-gray-50/50"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="mt-1">
            <input
              {...register('password')}
              type="password"
              className="appearance-none block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent sm:text-sm transition-all bg-gray-50/50"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/register" className="font-medium text-purple-600 hover:text-purple-700">
              Don't have an account? Register
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}
