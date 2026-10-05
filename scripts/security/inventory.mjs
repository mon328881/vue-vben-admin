#!/usr/bin/env node
/**
 * scripts/security/inventory.mjs
 * Pure Node.js Baseline Reconnaissance & Dangerous API Inventory Scanner (Read-Only)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.resolve(rootDir, 'reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log(`[Security Inventory] Scanning repository at: ${rootDir}`);

const IGNORED_DIRS = new Set([
  '.git',
  '.tmp_restore',
  '.turbo',
  '__snapshots__',
  'coverage',
  'dist',
  'node_modules',
]);

const scanRules = [
  {
    category: 'D1_XSS_AND_DOM_SINKS',
    title: 'XSS & Dangerous DOM / Execution Sinks',
    regex: /v-html|innerHTML|outerHTML|document\.write|eval\(|new Function/,
    extensions: ['.vue', '.ts', '.tsx', '.js', '.mjs'],
    searchDirs: ['apps', 'packages'],
  },
  {
    category: 'D2_REDIRECT_AND_POSTMESSAGE',
    title: 'Client Redirection & PostMessage Sinks',
    regex:
      /window\.location|location\.(href|replace|assign)|window\.open|postMessage|target="_blank"/,
    extensions: ['.vue', '.ts', '.tsx', '.js', '.mjs'],
    searchDirs: ['apps', 'packages'],
  },
  {
    category: 'D3_ROUTER_DYNAMIC_NAVIGATION',
    title: 'Dynamic Router Navigation Sinks',
    regex: /router\.(push|replace)\s*\(/,
    extensions: ['.vue', '.ts', '.tsx'],
    searchDirs: ['apps', 'packages'],
  },
  {
    category: 'D4_STORAGE_AND_LOGGING',
    title: 'Local Storage & Console Leakage Sinks',
    regex: /localStorage|sessionStorage|console\.(log|debug)/,
    extensions: ['.vue', '.ts', '.tsx', '.js'],
    searchDirs: ['apps/web-mgr/src', 'apps/web-mch/src', 'apps/web-agent/src'],
  },
  {
    category: 'D5_HARDCODED_SECRETS_PATTERNS',
    title: 'Potential Hardcoded Secrets & Token Literals',
    regex:
      /(api[_-]?key|secret|passwd|password|token)\s*[:=]\s*['"][a-zA-Z0-9_\-+/]{10,}['"]/i,
    extensions: ['.vue', '.ts', '.tsx', '.js', '.json'],
    searchDirs: ['apps', 'packages'],
  },
];

function collectFiles(dirPath, allowedExts, result = []) {
  if (!fs.existsSync(dirPath)) return result;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name.startsWith('.') &&
      !entry.name.startsWith('.env') &&
      entry.name !== '.core'
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        collectFiles(path.join(dirPath, entry.name), allowedExts, result);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (allowedExts.includes(ext) || entry.name.startsWith('.env')) {
        result.push(path.join(dirPath, entry.name));
      }
    }
  }
  return result;
}

const inventoryResults = {};
let totalFindings = 0;

for (const rule of scanRules) {
  const matches = [];
  const targetDirs = rule.searchDirs.map((d) => path.resolve(rootDir, d));
  const fileSet = new Set();
  for (const dir of targetDirs) {
    const files = collectFiles(dir, rule.extensions);
    for (const f of files) fileSet.add(f);
  }

  for (const filePath of fileSet) {
    // Skip test files if not checking execution sinks
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (rule.regex.test(line)) {
          // ignore comments for secrets
          if (rule.category === 'D5_HARDCODED_SECRETS_PATTERNS') {
            const trimmed = line.trim();
            if (
              trimmed.startsWith('//') ||
              trimmed.startsWith('*') ||
              trimmed.startsWith('/*')
            ) {
              continue;
            }
          }
          matches.push({
            file: path.relative(rootDir, filePath),
            line: i + 1,
            snippet: line.trim(),
          });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  inventoryResults[rule.category] = {
    title: rule.title,
    count: matches.length,
    matches,
  };
  totalFindings += matches.length;
  console.log(`[+] ${rule.title}: ${matches.length} hits`);
}

// 1. Output JSON
const jsonPath = path.resolve(reportsDir, 'security-inventory.json');
fs.writeFileSync(
  jsonPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      target: 'asiapay-admin',
      totalFindings,
      categories: inventoryResults,
    },
    null,
    2,
  ),
  'utf8',
);

// 2. Output Markdown
const mdPath = path.resolve(reportsDir, 'security-inventory.md');
let mdContent = `# AsiaPay Admin (新前端) 安全模式基线扫描与证据清单\n\n`;
mdContent += `- **扫描时间**: ${new Date().toISOString()}\n`;
mdContent += `- **目标目录**: \`asiapay-admin\` (apps/web-*, packages/*)\n`;
mdContent += `- **总命中数**: ${totalFindings} 项模式命中\n\n`;
mdContent += `## 摘要统计\n\n`;
mdContent += `| 维度分类 | 描述 | 命中数量 |\n`;
mdContent += `| :--- | :--- | :---: |\n`;

for (const [key, data] of Object.entries(inventoryResults)) {
  mdContent += `| \`${key}\` | ${data.title} | **${data.count}** |\n`;
}

mdContent += `\n---\n\n## 证据详情索引\n\n`;

for (const [key, data] of Object.entries(inventoryResults)) {
  mdContent += `### ${data.title} (\`${key}\` - 共 ${data.count} 项)\n\n`;
  if (data.matches.length === 0) {
    mdContent += `*未发现匹配项，基线良好。*\n\n`;
  } else {
    mdContent += `| 文件位置 | 行号 | 代码片段 |\n`;
    mdContent += `| :--- | :---: | :--- |\n`;
    const displayList = data.matches.slice(0, 50);
    for (const m of displayList) {
      const escapedSnippet = (m.snippet || '')
        .replaceAll('|', String.raw`\|`)
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
      mdContent += `| \`${m.file}\` | ${m.line} | \`${escapedSnippet}\` |\n`;
    }
    mdContent +=
      data.matches.length > 50
        ? `\n> *已截断，前 50 / ${data.matches.length} 项已展示，完整数据参见 security-inventory.json*\n\n`
        : `\n`;
  }
}

fs.writeFileSync(mdPath, mdContent, 'utf8');
console.log(`[Security Inventory] Successfully generated:`);
console.log(`  - ${jsonPath}`);
console.log(`  - ${mdPath}`);
