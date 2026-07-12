/**
 * Safe RegExp utility — escapes user input before creating dynamic regex
 * Prevents ReDoS and regex injection attacks.
 *
 * Usage:
 *   const { escapeRegExp } = require('../utils/safe-regex.js');
 *   const re = new RegExp(escapeRegExp(userInput), 'gi');
 *
 * Escapes these special characters: . * + ? ^ $ { } ( ) [ ] \ |
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { escapeRegExp };
