// Structured debug logging — replaces scattered console.log
// Gate: set HEARTFLOW_DEBUG=1 to see debug-level output
const DEBUG = process.env.HEARTFLOW_DEBUG === '1';

module.exports = {
  debug(module, event, data = {}) {
    if (!DEBUG) return;
    console.log(JSON.stringify({ts: new Date().toISOString(), module, event, ...data}));
  },
  info(module, event, data = {}) {
    // info always prints (startup milestones)
    console.log(JSON.stringify({ts: new Date().toISOString(), module, event, ...data}));
  },
  warn(module, msg) {
    console.warn(`[${module}] ${msg}`);
  }
};