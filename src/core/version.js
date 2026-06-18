const fs = require('fs');
const path = require('path');
let VERSION = 'unknown';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
  VERSION = pkg.version || 'unknown';
} catch (e) {
  // fallback
}
module.exports = { VERSION };
