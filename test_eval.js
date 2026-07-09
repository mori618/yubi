const fs = require('fs');
const scriptContent = fs.readFileSync('./script.js', 'utf8');
const match = scriptContent.match(/function evaluateBoard[\s\S]*?\n\}/);
console.log(match[0]);
