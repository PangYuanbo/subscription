const fs = require('fs');
const path = require('path');

// Create a dummy chrome.js file in lucide-react
const lucidePath = path.join(__dirname, '..', 'node_modules', 'lucide-react', 'dist', 'esm', 'icons');
const chromePath = path.join(lucidePath, 'chrome.js');

const dummyContent = `// Dummy Chrome icon to avoid Windows Defender issues
const Chrome = () => null;
Chrome.displayName = 'Chrome';
export default Chrome;
`;

try {
  if (!fs.existsSync(chromePath)) {
    fs.writeFileSync(chromePath, dummyContent);
    console.log('Created dummy chrome.js file');
  } else {
    console.log('chrome.js already exists');
  }
} catch (error) {
  console.error('Error creating chrome.js:', error);
}