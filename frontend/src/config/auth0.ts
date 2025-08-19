export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  redirectUri: `${window.location.origin}/callback`,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
  scope: 'openid profile email read:subscriptions write:subscriptions',
};