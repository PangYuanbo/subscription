import { useAuth0 } from '@auth0/auth0-react';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  // If Auth0 is not configured, bypass authentication
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
  if (!auth0Domain) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Subscription Management System
          </h1>
          <p className="text-gray-600 mb-8">
            Please login to manage your subscription services
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}