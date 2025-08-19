import { auth0Config } from '@/config/auth0';

export const debugAuth0Config = () => {
  console.log('🔧 Auth0 Debug Information:');
  console.log('Current URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  console.log('Configured redirect URI:', auth0Config.redirectUri);
  console.log('Domain:', auth0Config.domain);
  console.log('Client ID:', auth0Config.clientId ? `${auth0Config.clientId.substring(0, 8)}...` : 'Not configured');
  console.log('Audience:', auth0Config.audience);
  
  console.log('\n📋 Required Auth0 Callback URLs:');
  console.log('- For development:', `http://localhost:5173/callback`);
  console.log('- For Vercel:', `https://subscription-seven-dun.vercel.app/callback`);
  
  console.log('\n⚠️  Make sure these URLs are EXACTLY configured in your Auth0 Application Settings!');
};

export const validateAuth0Config = () => {
  const errors = [];
  
  if (!auth0Config.domain) {
    errors.push('VITE_AUTH0_DOMAIN is not configured');
  }
  
  if (!auth0Config.clientId) {
    errors.push('VITE_AUTH0_CLIENT_ID is not configured');
  }
  
  if (!auth0Config.audience) {
    errors.push('VITE_AUTH0_AUDIENCE is not configured');
  }
  
  if (errors.length > 0) {
    console.error('❌ Auth0 Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }
  
  console.log('✅ Auth0 configuration is valid');
  return true;
};