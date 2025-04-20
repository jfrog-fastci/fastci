const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });

// Bundle with ncc
console.log('Bundling with ncc...');
execSync('npx @vercel/ncc build --source-map --license licenses.txt', { stdio: 'inherit' });

console.log('Build completed successfully!'); 