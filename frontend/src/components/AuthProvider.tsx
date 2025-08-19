import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';
import { auth0Config } from '@/config/auth0';
import { debugAuth0Config, validateAuth0Config } from '@/utils/auth0-debug';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const onRedirectCallback = (appState: any) => {
    // After successful Auth0 callback, redirect to the intended page or home
    const targetUrl = appState?.returnTo || '/';
    window.history.replaceState({}, document.title, targetUrl);
  };

  // Debug Auth0 configuration
  if (import.meta.env.DEV) {
    debugAuth0Config();
    validateAuth0Config();
  }

  // If Auth0 is not configured, render children without Auth0Provider
  if (!auth0Config.domain || !auth0Config.clientId) {
    console.log('Auth0 not configured, skipping authentication');
    return <>{children}</>;
  }

  try {
    return (
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={{
          redirect_uri: auth0Config.redirectUri,
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        }}
        onRedirectCallback={onRedirectCallback}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        {children}
      </Auth0Provider>
    );
  } catch (error) {
    console.error('Auth0Provider initialization failed:', error);
    console.error('Error details:', error);
    return <>{children}</>;
  }
}