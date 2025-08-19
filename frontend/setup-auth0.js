#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Auth0 Setup for Subscription Tracker\n');

const questions = [
  'Enter your Auth0 Domain (e.g., your-tenant.auth0.com): ',
  'Enter your Auth0 Client ID: ',
  'Enter your Auth0 API Audience (optional, press Enter to skip): '
];

const answers = [];

function askQuestion(index) {
  if (index >= questions.length) {
    setupEnvFile();
    return;
  }

  rl.question(questions[index], (answer) => {
    answers.push(answer.trim());
    askQuestion(index + 1);
  });
}

function setupEnvFile() {
  const [domain, clientId, audience] = answers;

  if (!domain || !clientId) {
    console.log('❌ Domain and Client ID are required!');
    rl.close();
    return;
  }

  const envContent = `# Auth0 Configuration
VITE_AUTH0_DOMAIN=${domain}
VITE_AUTH0_CLIENT_ID=${clientId}
VITE_AUTH0_AUDIENCE=${audience || 'https://subscription-tracker-api'}

# API Configuration
VITE_API_URL=http://localhost:8000
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Open http://localhost:5173');
    console.log('3. Test the Auth0 login flow');
    console.log('\n📖 For detailed setup instructions, see AUTH0_SETUP.md');
  } catch (error) {
    console.log('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

console.log('Follow the instructions in AUTH0_SETUP.md to get your Auth0 credentials.\n');
askQuestion(0);