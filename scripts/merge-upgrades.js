#!/usr/bin/env node
/**
 * HeartFlow Upgrade Merger
 * Merge Processor classes from upgrades/v0.13.* into src/core/paper-processors/
 */

const fs = require('fs');
const path = require('path');

const UPGRADES_DIR = '/Users/apple/.hermes/skills/ai/mark-heartflow-skill/upgrades';
const OUTPUT_FILE = '/Users/apple/.hermes/skills/ai/mark-heartflow-skill/src/core/paper-processors/index.js';

const UPGRADE_VERSIONS = [
    'v0.13.143', 'v0.13.144', 'v0.13.145', 'v0.13.146', 'v0.13.147',
    'v0.13.148', 'v0.13.149', 'v0.13.150', 'v0.13.151', 'v0.13.152',
    'v0.13.153', 'v0.13.154', 'v0.13.155', 'v0.13.156', 'v0.13.157', 'v0.13.158'
];

/**
 * Extract a class definition from content.
 * Matches from "class Name {" to the closing "}\n" that terminates it.
 * Uses brace counting to find the correct closing brace.
 */
function extractClass(content, className) {
    const startPat = new RegExp('class ' + className + ' \\{');
    const start = content.search(startPat);
    if (start === -1) return null;
    
    let braceCount = 0;
    let i = content.indexOf('{', start);
    let inString = false;
    let stringChar = '';
    
    while (i < content.length) {
        const c = content[i];
        const prev = i > 0 ? content[i-1] : '';
        
        if (!inString) {
            if (c === '"' || c === "'" || c === '`') {
                inString = true;
                stringChar = c;
            } else if (c === '{') {
                braceCount++;
            } else if (c === '}') {
                braceCount--;
                if (braceCount === 0) {
                    return content.slice(start, i + 1) + '\n';
                }
            }
        } else {
            if (c === stringChar && prev !== '\\') {
                inString = false;
            }
        }
        i++;
    }
    return null;
}

function mergeUpgrades() {
    console.log('Merging upgrade modules...\n');

    let thoughtClass = '';
    let memoryClass = '';
    const processors = new Map();  // name -> definition
    let totalCount = 0;

    for (const version of UPGRADE_VERSIONS) {
        const upgradeFile = path.join(UPGRADES_DIR, version, 'index.js');
        if (!fs.existsSync(upgradeFile)) {
            console.log(`  ${version}: FILE NOT FOUND`);
            continue;
        }

        const content = fs.readFileSync(upgradeFile, 'utf8');
        const count = (content.match(/class psychology_[a-zA-Z0-9_]+_Processor /g) || []).length;
        console.log(`  ${version}: ${count} processors`);
        totalCount += count;

        if (!thoughtClass) {
            const t = extractClass(content, 'Thought');
            if (t) thoughtClass = t;
        }
        if (!memoryClass) {
            const m = extractClass(content, 'MemoryEntry');
            if (m) memoryClass = m;
        }

        const procPattern = /class (psychology_[a-zA-Z0-9_]+_Processor) /g;
        let match;
        while ((match = procPattern.exec(content)) !== null) {
            const name = match[1];
            if (!processors.has(name)) {
                const def = extractClass(content, name);
                if (def) processors.set(name, def);
            }
        }
    }

    console.log(`\nTotal processor files: ${totalCount}`);
    console.log(`Unique processors extracted: ${processors.size}`);

    const sortedNames = [...processors.keys()].sort();
    const exportNames = sortedNames.join(',\n  ');

    const mergedContent = [
        '/**',
        ' * HeartFlow Paper Processors',
        ' * Merged from upgrades/v0.13.143 ~ v0.13.158',
        ' * Merge time: ' + new Date().toISOString(),
        ' * Total processors: ' + processors.size,
        ' */\n',
        '// ====== Core Types ======\n',
        thoughtClass,
        memoryClass,
        '\n// ====== Paper Processors (' + sortedNames.length + ' classes) ======\n',
        [...processors.values()].join('\n\n'),
        '\n// ====== Exports ======\n',
        'module.exports = {',
        '  Thought,',
        '  MemoryEntry,',
        '  ' + exportNames,
        '};'
    ].join('\n');

    fs.writeFileSync(OUTPUT_FILE, mergedContent);

    const lines = mergedContent.split('\n').length;
    console.log('\n===========================================');
    console.log('Merge complete!');
    console.log('Output: ' + OUTPUT_FILE);
    console.log('Processors: ' + processors.size);
    console.log('Lines: ' + lines);
}

mergeUpgrades();
