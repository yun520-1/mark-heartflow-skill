#!/usr/bin/env node

/**
 * ComfyUI Video Monitor & Downloader
 * 监控 ComfyUI 服务，下载新生成的视频
 * 每15分钟运行一次
 * 
 * 注意：rejectUnauthorized:false 用于自签名证书
 * 如需生产环境使用，请配置正确的CA证书
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// 必须通过环境变量配置，无默认值
const COMFYUI_URL = process.env.COMFYUI_URL;
if (!COMFYUI_URL) {
  console.error('❌ 错误: 必须设置 COMFYUI_URL 环境变量');
  console.error('   示例: COMFYUI_URL=https://your-server.com node scripts/comfyui-monitor.js');
  process.exit(1);
}
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'downloads', 'comfyui-videos');
const STATE_FILE = path.join(OUTPUT_DIR, '.downloaded-history.json');
const LOG_FILE = process.env.LOG_FILE || path.join(__dirname, '..', 'logs', 'comfyui-monitor.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, msg);
  console.log(msg);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDownloadedHistory() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    log(`Error loading history: ${e.message}`);
  }
  return { downloaded: [], lastCheck: null };
}

function saveDownloadedHistory(history) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(history, null, 2));
}

function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    
    // 默认允许自签名证书，可通过环境变量控制
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 30000,
      rejectUnauthorized: true
    };
    
    https.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchHistory() {
  try {
    const data = await httpGet(`${COMFYUI_URL}/history`);
    return JSON.parse(data);
  } catch (e) {
    log(`Error fetching history: ${e.message}`);
    return null;
  }
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    // 默认允许自签名证书，可通过环境变量控制
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 120000,
      rejectUnauthorized: true
    };
    
    https.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        log(`Downloaded: ${filepath}`);
        resolve(filepath);
      });
    }).on('error', (err) => {
      try { fs.unlinkSync(filepath); } catch {}
      reject(err);
    });
  });
}

async function checkAndDownload() {
  log('=== Checking ComfyUI for new videos ===');
  
  ensureDir(OUTPUT_DIR);
  const history = loadDownloadedHistory();
  
  const historyData = await fetchHistory();
  if (!historyData) {
    log('Failed to fetch history');
    return 0;
  }
  
  const promptIds = Object.keys(historyData);
  let newDownloads = 0;
  
  for (const promptId of promptIds) {
    if (history.downloaded.includes(promptId)) {
      continue;
    }
    
    const promptData = historyData[promptId];
    if (!promptData.outputs) continue;
    
    for (const [nodeId, nodeOutput] of Object.entries(promptData.outputs)) {
      // 检查图片输出 - ComfyUI 把视频放在 images 数组里
      if (nodeOutput.images) {
        for (const img of nodeOutput.images) {
          const filename = img.filename;
          const subfolder = img.subfolder || '';
          const type = img.type || 'output';
          const ext = path.extname(filename).toLowerCase();
          
          // 只下载视频文件
          if (!['.mp4', '.webm', '.avi', '.mov'].includes(ext)) {
            continue;
          }
          
          // 构建完整路径 - 包含 subfolder
          let downloadPath = filename;
          if (subfolder) {
            downloadPath = `${subfolder}/${downloadPath}`;
          }
          
          const localFilename = `${promptId}_${filename}`;
          const filepath = path.join(OUTPUT_DIR, localFilename);
          const fileUrl = `${COMFYUI_URL}/view?filename=${encodeURIComponent(downloadPath)}&type=${type}&subfolder=${encodeURIComponent(subfolder)}`;
          
          try {
            await downloadFile(fileUrl, filepath);
            history.downloaded.push(promptId);
            newDownloads++;
            log(`✅ Downloaded video: ${localFilename}`);
          } catch (e) {
            log(`❌ Failed to download ${localFilename}: ${e.message}`);
          }
        }
      }
      
      // 检查视频输出
      if (nodeOutput.videos) {
        for (const video of nodeOutput.videos) {
          const videoName = video.video_name;
          const filename = `${promptId}_${videoName}`;
          const filepath = path.join(OUTPUT_DIR, filename);
          const fileUrl = `${COMFYUI_URL}/view?filename=${encodeURIComponent(videoName)}&prompt_id=${promptId}`;
          
          try {
            await downloadFile(fileUrl, filepath);
            history.downloaded.push(promptId);
            newDownloads++;
            log(`✅ Downloaded video: ${filename}`);
          } catch (e) {
            log(`❌ Failed to download ${filename}: ${e.message}`);
          }
        }
      }
    }
  }
  
  history.lastCheck = new Date().toISOString();
  saveDownloadedHistory(history);
  
  log(`=== Check complete: ${newDownloads} new videos downloaded ===`);
  return newDownloads;
}

async function listVideos() {
  const history = await fetchHistory();
  if (!history) {
    console.log('Failed to fetch history');
    return;
  }
  
  console.log('\n📹 Recent ComfyUI Outputs:');
  console.log('='.repeat(50));
  
  const promptIds = Object.keys(history).slice(-10).reverse();
  
  for (const promptId of promptIds) {
    const data = history[promptId];
    console.log(`\n🔹 Prompt: ${promptId.slice(0, 12)}...`);
    
    if (data.outputs) {
      for (const [nodeId, output] of Object.entries(data.outputs)) {
        if (output.images) {
          for (const img of output.images) {
            const ext = path.extname(img.filename).toLowerCase();
            const isVideo = ['.mp4', '.webm', '.avi', '.mov'].includes(ext);
            console.log(`   ${isVideo ? '🎬' : '📷'} ${img.filename}`);
          }
        }
        if (output.videos) {
          for (const v of output.videos) {
            console.log(`   🎬 ${v.video_name}`);
          }
        }
      }
    }
  }
}

// CLI
const args = process.argv.slice(2);

if (args[0] === 'list') {
  listVideos().then(() => process.exit(0));
} else if (args[0] === 'status') {
  const history = loadDownloadedHistory();
  console.log(`\n📊 Download Status:`);
  console.log(`   Downloaded prompts: ${history.downloaded.length}`);
  console.log(`   Last check: ${history.lastCheck || 'never'}`);
  console.log(`   Output directory: ${OUTPUT_DIR}`);
} else {
  checkAndDownload()
    .then(count => {
      log(`Done: ${count} new videos`);
      process.exit(0);
    })
    .catch(e => {
      log(`Error: ${e.message}`);
      process.exit(1);
    });
}

module.exports = { checkAndDownload, listVideos };
