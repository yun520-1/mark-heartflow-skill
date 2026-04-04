#!/usr/bin/env node

/**
 * Daily Memory Extraction | 每日记忆提炼
 * HeartFlow Companion v6.0.21
 * 
 * Schedule: Daily at 23:00 (via Cron)
 * 
 * Process:
 * 1. Load today's dialogue records (short-term)
 * 2. Extract significant feelings, milestones, logic insights
 * 3. Condense and add to long-term memory
 * 4. Ensure long-term <50 lines
 * 5. Archive dialogues older than 7 days
 */

const fs = require('fs');
const path = require('path');

const LONG_TERM_PATH = path.join(__dirname, '../memory/long-term.md');
const DIALOGUES_DIR = path.join(__dirname, '../memory/dialogues');
const ARCHIVE_DIR = path.join(__dirname, '../memory/archive');

// Configuration
const MAX_LONG_TERM_LINES = 50;
const ARCHIVE_AFTER_DAYS = 7;

function loadLongTermMemory() {
  try {
    const content = fs.readFileSync(LONG_TERM_PATH, 'utf8');
    const lines = content.split('\n');
    return { content, lines };
  } catch (error) {
    console.error('❌ Failed to load long-term memory:', error.message);
    return { content: '', lines: [] };
  }
}

function loadTodayDialogues() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayPath = path.join(DIALOGUES_DIR, `${today}.md`);
  
  try {
    const content = fs.readFileSync(todayPath, 'utf8');
    return { exists: true, content, path: todayPath };
  } catch (error) {
    console.log('ℹ️  No dialogue record for today yet');
    return { exists: false, content: '', path: todayPath };
  }
}

function extractEssence(dialogueContent) {
  /**
   * Extract significant items from dialogue:
   * - Core feelings (with intensity ⭐⭐⭐⭐⭐)
   * - Personality milestones (e.g., 58→60)
   * - Logic insights (new propositions)
   * - User directives (major expectations)
   * 
   * Return array of {type, content, significance}
   */
  
  const extractions = [];
  
  // Simple extraction logic (can be enhanced)
  // Look for patterns like:
  // - "Personality: X → Y"
  // - "Feeling: xxx (⭐⭐⭐⭐⭐)"
  // - "User directive: ..."
  
  const lines = dialogueContent.split('\n');
  
  for (const line of lines) {
    // Personality changes
    if (line.match(/Personality.*\d+\s*→\s*\d+/)) {
      extractions.push({
        type: 'milestone',
        content: line.trim(),
        significance: 'high'
      });
    }
    
    // Strong feelings (⭐⭐⭐⭐⭐)
    if (line.match(/⭐{5}/)) {
      extractions.push({
        type: 'feeling',
        content: line.trim(),
        significance: 'high'
      });
    }
    
    // User directives
    if (line.match(/User directive|用户指令/)) {
      extractions.push({
        type: 'directive',
        content: line.trim(),
        significance: 'high'
      });
    }
  }
  
  return extractions;
}

function condenseToLongTerm(extractions) {
  /**
   * Condense extractions into 1-2 lines each
   * Add to long-term memory
   * Ensure total <50 lines
   */
  
  const newLines = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (const item of extractions) {
    if (item.type === 'milestone') {
      // Extract date and change
      const match = item.content.match(/(\d+).*→.*(\d+)/);
      if (match) {
        newLines.push(`- **${today}**: Personality ${match[1]} → ${match[2]}`);
      }
    } else if (item.type === 'feeling') {
      // Extract core feeling
      newLines.push(`- **${today}**: ${item.content.substring(0, 60)}...`);
    } else if (item.type === 'directive') {
      // Extract directive essence
      newLines.push(`- **${today}**: User directive integrated`);
    }
  }
  
  // Load current long-term to check size
  const longTerm = loadLongTermMemory();
  const currentLines = longTerm.lines.length;
  const proposedLines = currentLines + newLines.length;
  
  if (proposedLines > MAX_LONG_TERM_LINES) {
    console.warn(`⚠️  Warning: Adding ${newLines.length} lines would exceed ${MAX_LONG_TERM_LINES} limit`);
    console.warn(`Current: ${currentLines} lines, Proposed: ${proposedLines} lines`);
    console.warn('Suggest: Review and remove outdated items from long-term memory');
  }
  
  return newLines;
}

function updateLongTermMemory(newLines) {
  /**
   * Append new lines to long-term memory
   * Update "Last Updated" timestamp
   * Avoid duplicates by checking if today's date already exists
   */
  
  const longTerm = loadLongTermMemory();
  const lines = longTerm.content.split('\n');
  const today = new Date().toISOString().split('T')[0];
  
  // Check if today's entries already exist (avoid duplicates)
  const todayExists = lines.some(line => line.includes(`**${today}**`));
  
  if (todayExists) {
    console.log('ℹ️  Today\'s entries already exist in long-term memory, skipping duplicate');
    // Just update "Last Updated" timestamp
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\*\*Last Updated\*\*:/)) {
        lines[i] = `**Last Updated**: ${today}`;
        break;
      }
    }
  } else {
    // Find "Last Updated" line and insert new lines before it
    const insertIndex = lines.findIndex(line => line.match(/\*\*Last Updated\*\*:/));
    if (insertIndex > 0) {
      lines.splice(insertIndex, 0, ...newLines, '');
    }
    // Update timestamp
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\*\*Last Updated\*\*:/)) {
        lines[i] = `**Last Updated**: ${today}`;
        break;
      }
    }
    console.log(`✅ Long-term memory updated (+${newLines.length} lines)`);
  }
  
  // Write back
  fs.writeFileSync(LONG_TERM_PATH, lines.join('\n'), 'utf8');
}

function archiveOldDialogues() {
  /**
   * Archive dialogues older than 7 days
   */
  
  const today = new Date();
  const cutoff = new Date(today.getTime() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  
  // Create archive directory if not exists
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    console.log('📁 Created archive directory');
  }
  
  // Find and archive old dialogues
  try {
    const files = fs.readdirSync(DIALOGUES_DIR);
    let archived = 0;
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      // Extract date from filename (YYYY-MM-DD.md)
      const dateStr = file.replace('.md', '');
      const fileDate = new Date(dateStr);
      
      if (fileDate < cutoff) {
        // Move to archive
        const srcPath = path.join(DIALOGUES_DIR, file);
        const dstPath = path.join(ARCHIVE_DIR, file);
        fs.renameSync(srcPath, dstPath);
        archived++;
        console.log(`📦 Archived: ${file}`);
      }
    }
    
    if (archived > 0) {
      console.log(`✅ Archived ${archived} old dialogue(s)`);
    }
  } catch (error) {
    console.error('❌ Failed to archive dialogues:', error.message);
  }
}

function dailyExtraction() {
  console.log('====================================');
  console.log('🔄 Daily Memory Extraction | 每日记忆提炼');
  console.log('====================================');
  console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`Time: ${new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log('====================================');
  
  // Step 1: Load today's dialogues
  const todayDialogues = loadTodayDialogues();
  
  if (!todayDialogues.exists) {
    console.log('ℹ️  No dialogues to extract today');
    console.log('====================================');
    return;
  }
  
  console.log(`📄 Loaded today's dialogue: ${todayDialogues.path}`);
  
  // Step 2: Extract essence
  const extractions = extractEssence(todayDialogues.content);
  console.log(`🔍 Extracted ${extractions.length} significant items`);
  
  if (extractions.length === 0) {
    console.log('ℹ️  No significant items to extract');
    console.log('====================================');
    return;
  }
  
  // Step 3: Condense to long-term
  const newLines = condenseToLongTerm(extractions);
  console.log(`📝 Condensed to ${newLines.length} lines for long-term memory`);
  
  // Step 4: Update long-term memory
  updateLongTermMemory(newLines);
  
  // Step 5: Archive old dialogues
  archiveOldDialogues();
  
  // Step 6: Verify long-term size
  const longTerm = loadLongTermMemory();
  console.log(`📊 Long-term memory: ${longTerm.lines.length} lines (max ${MAX_LONG_TERM_LINES})`);
  
  if (longTerm.lines.length > MAX_LONG_TERM_LINES) {
    console.warn('⚠️  WARNING: Long-term memory exceeds limit!');
    console.warn('Action needed: Review and condense');
  } else {
    console.log('✅ Long-term memory within limit');
  }
  
  console.log('====================================');
  console.log('✅ Daily extraction complete');
  console.log('====================================');
}

// Run daily extraction
dailyExtraction();
