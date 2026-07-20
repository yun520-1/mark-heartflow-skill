const path = require('path');

module.exports = {
  apps: [{
    name: 'heartflow-mcp',
    script: path.join(__dirname, 'mcp', 'mcp-server-http.js'),
    args: '--port 8099',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    max_memory_restart: '512M',
    env: { NODE_ENV: 'production' },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: path.join(__dirname, 'data', 'logs', 'heartflow-error.log'),
    out_file: path.join(__dirname, 'data', 'logs', 'heartflow-out.log'),
  }]
};
