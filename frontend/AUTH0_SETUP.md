# Auth0 Setup Instructions

## Step 1: Create Auth0 Account and Application

1. Go to [Auth0](https://auth0.com) and create a free account
2. Once logged in, go to **Applications** → **Create Application**
3. Choose:
   - **Name**: Subscription Tracker
   - **Type**: Single Page Web Applications
   - Click **Create**

## Step 2: Configure Application Settings

In your Auth0 application dashboard:

### Application URIs
- **Allowed Callback URLs**: `http://localhost:5173, http://localhost:3000`
- **Allowed Logout URLs**: `http://localhost:5173, http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:5173, http://localhost:3000`

### Settings to Copy
You'll need these values from the **Settings** tab:
- **Domain**: `your-tenant.auth0.com`
- **Client ID**: `your-client-id`

## Step 3: Create API (Optional - for backend integration)

1. Go to **APIs** → **Create API**
2. Set:
   - **Name**: Subscription Tracker API
   - **Identifier**: `https://subscription-tracker-api`
   - **Signing Algorithm**: RS256

## Step 4: Update Environment Variables

Copy the values to your `.env` file:

```bash
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://subscription-tracker-api

# API Configuration
VITE_API_URL=http://localhost:8000
```

## Step 5: Test the Setup

1. Start the development server: `npm run dev`
2. Open `http://localhost:5173`
3. You should see a login button
4. Click login and complete the Auth0 flow
5. You should be redirected back to the app as authenticated

## Troubleshooting

- Make sure callback URLs match exactly
- Check browser console for errors
- Verify environment variables are loaded correctly