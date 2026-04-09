const fs = require('fs');
const { argv } = require('process');

// Read as text (NOT base64 yet)
const dataUrl = fs.readFileSync(argv[2], 'utf8');

// Split header and Base64 data
const base64Data = dataUrl.split(',')[1];

// Decode Base64 → binary
const buffer = Buffer.from(base64Data, 'base64');

// Write binary file
fs.writeFileSync('output.wav', buffer);