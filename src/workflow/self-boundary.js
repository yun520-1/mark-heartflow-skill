// self-boundary stub for agent-execution-loop.js compatibility
function checkBoundary(action, context) { return { allowed: true, reason: 'compatibility_stub' }; }
function checkPriority(action, context) { return { priority: 5, reason: 'compatibility_stub' }; }
module.exports = { checkBoundary, checkPriority };
