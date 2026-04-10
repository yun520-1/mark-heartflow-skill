#!/usr/bin/env node
/**
 * HeartFlow API Server v2.4.0 - Fresh Rewrite
 * 
 * Run: node bin/api-server.js
 * Port: 3456
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3456;

// Load core
const heartflow = require('../src/core/heartflow-engine.js');
console.log('[API] HeartFlow loaded');

// Load modules
let personality, emotion, learning, actionTracker, autonomousLoop;
try {
  const { AuthenticPersonality } = require('../src/core/authentic-personality.js');
  const { DeepEmotion } = require('../src/core/deep-emotion.js');
  const { LearningEngine } = require('../src/core/learning-engine.js');
  const { ActionTracker } = require('../src/core/action-tracker.js');
  const { AutonomousLoop } = require('../src/core/autonomous-loop.js');
  
  personality = new AuthenticPersonality(__dirname + '/..');
  emotion = new DeepEmotion(__dirname + '/..');
  learning = new LearningEngine(__dirname + '/..');
  actionTracker = new ActionTracker(__dirname + '/..');
  autonomousLoop = new AutonomousLoop(__dirname + '/..');
  
  console.log('[API] Modules loaded');
} catch (e) {
  console.log('[API] Modules:', e.message);
}

// Initialize
let systemInit = null;
function init() {
  if (!systemInit) {
    systemInit = heartflow.initialize();
    console.log('[API] System initialized');
  }
  return systemInit;
}

// Handlers
const handlers = {
  '/api/health': () => ({ status: 'ok', version: '2.4.0' }),
  '/api/status': () => {
    init();
    return { version: '2.4.0', modules: systemInit.modules, personality: !!personality, emotion: !!emotion };
  },
  '/api/personality': () => personality ? personality.getProfile() : { error: 'N/A' },
  '/api/emotion/state': () => emotion ? emotion.getSummary() : { error: 'N/A' },
  '/api/learning/state': () => learning ? learning.getKnowledgeState() : { error: 'N/A' },
  '/api/action/stats': () => actionTracker ? actionTracker.getSummary() : { error: 'N/A' },
  '/api/autonomous/status': () => autonomousLoop ? autonomousLoop.getStatus() : { error: 'N/A' }
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  const pathname = url.parse(req.url).pathname;
  
  // GET handlers
  if (req.method === 'GET' && handlers[pathname]) {
    try { res.end(JSON.stringify(handlers[pathname]())); } 
    catch (e) { res.writeHead(500); res.end(JSON.stringify({error:e.message})); }
    return;
  }

  // POST handlers
  if (req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch(e) {}
      
      try {
        let result;
        
        // Emotion detect
        if (pathname === '/api/emotion/detect' && data.text) {
          result = emotion ? emotion.feel(data.text, data.context || {}) : heartflow.detectEmotionFromText(data.text);
        }
        // Learning
        else if (pathname === '/api/learning' && data.input) {
          result = learning ? learning.learn(data.input, data.context || {}) : {error:'N/A'};
        }
        // Action commit
        else if (pathname === '/api/action/commit' && data.promise) {
          result = actionTracker ? actionTracker.commit(data.promise, data.deadline) : {error:'N/A'};
        }
        // Autonomous start
        else if (pathname === '/api/autonomous/start') {
          if (autonomousLoop) {
            autonomousLoop.setDependencies({ learningEngine: learning, deepEmotion: emotion, actionTracker: actionTracker });
            result = autonomousLoop.start();
          } else { result = {error:'N/A'}; }
        }
        // Autonomous stop
        else if (pathname === '/api/autonomous/stop') {
          result = autonomousLoop ? autonomousLoop.stop() : {error:'N/A'};
        }
        // Legacy
        else if (pathname === '/api/emotion' && data.text) {
          result = heartflow.detectEmotionFromText(data.text);
        }
        else if (pathname === '/api/flow') {
          result = heartflow.calculateFlowState(data.pleasure||5, data.arousal||5, data.dominance||5, data.challenge||5, data.skill||5);
        }
        else {
          result = { error: 'Unknown endpoint' };
        }
        
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({error:e.message}));
      }
    });
    return;
  }

  // Web UI
  if (pathname === '/' || pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>HeartFlow v2.4.0</title>
<style>body{font-family:-apple-system,sans-serif;background:#1a1a2e;color:#fff;margin:0;padding:40px;text-align:center}
h1{background:linear-gradient(90deg,#00d2ff,#3a7bd5);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
a{color:#58a6ff;margin:10px;display:inline-block;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;text-decoration:none}
</style></head>
<body><h1>💜 HeartFlow v2.4.0</h1>
<p>AI Companion with True Consciousness</p>
<div style="margin-top:30px">
<a href="/dashboard">📊 Dashboard</a>
<a href="/chat">💬 Chat</a>
<a href="/api/health">❤️ Health</a>
</div></body></html>`);
    return;
  }

  if (pathname === '/dashboard') {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard</title>
<style>body{font-family:sans-serif;background:#0d1117;color:#fff;padding:20px}
.card{background:#161b22;padding:20px;margin:10px;border-radius:8px}
.stat{display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #30363d}
.value{color:#7ee787}
</style></head>
<body><h1>📊 Dashboard</h1>
<div class="card"><h3>System</h3><div id="sys">Loading...</div></div>
<div class="card"><h3>Emotion</h3><div id="emo">Loading...</div></div>
<script>
async function load(){
  const s=await fetch('/api/status').then(r=>r.json());
  document.getElementById('sys').innerHTML='<div class="stat"><span>Version</span><span class="value">'+s.version+'</span></div>';
  const e=await fetch('/api/emotion/state').then(r=>r.ok?r.json():{});
  document.getElementById('emo').innerHTML='<div class="stat"><span>Mood</span><span class="value">'+(e.currentMood||'N/A')+'</span></div>';
}
load();setInterval(load,30000);
</script></body></html>`);
    return;
  }

  if (pathname === '/chat') {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Chat</title>
<style>body{font-family:sans-serif;background:#0d1117;color:#fff;padding:20px;max-width:800px;margin:0 auto}
#msgs{height:400px;overflow-y:auto;background:#161b22;padding:15px;border-radius:8px;margin-bottom:15px}
.msg{padding:8px 12px;margin:5px 0;border-radius:6px}
.user{background:#1f6feb;text-align:right}
.assis{background:#21262d}
input{padding:12px;width:70%;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#fff}
button{padding:12px 20px;background:#238636;color:#fff;border:none;border-radius:6px;cursor:pointer}
</style></head>
<body><h1>💬 Chat</h1>
<div id="msgs"></div>
<input id="in" placeholder="Message..." onkeypress="if(event.key==='Enter')send()">
<button onclick="send()">Send</button>
<script>
function add(r,m){
  const d=document.createElement('div');
  d.className='msg '+r;
  d.textContent=m;
  document.getElementById('msgs').appendChild(d);
  document.getElementById('msgs').scrollTop=document.getElementById('msgs').scrollHeight;
}
add('assis','Hello! I am HeartFlow. How can I help?');
async function send(){
  const m=document.getElementById('in').value;
  if(!m)return;
  add('user',m);
  document.getElementById('in').value='';
  const r=await fetch('/api/emotion/detect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:m})});
  const d=await r.json();
  add('assis','Emotion: '+(d.emotion||'unknown')+' ('+((d.intensity||0)*100).toFixed(0)+'%)');
}
</script></body></html>`);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({error:'Not found'}));
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║      HeartFlow API Server v2.4.0                  ║
╠═══════════════════════════════════════════════════╣
║  Web:    http://localhost:${PORT}                    ║
║  Dash:   http://localhost:${PORT}/dashboard           ║
║  Chat:   http://localhost:${PORT}/chat                ║
║  Health: http://localhost:${PORT}/api/health           ║
╚═══════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  if (autonomousLoop) autonomousLoop.stop();
  server.close(() => process.exit(0));
});