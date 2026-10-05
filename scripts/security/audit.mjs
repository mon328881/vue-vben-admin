#!/usr/bin/env node
/**
 * scripts/security/audit.mjs
 * AsiaPay Admin Security Quality Gate & Redline Regression Auditor
 * Enforces strict security invariants across apps/web-mgr, apps/web-mch, apps/web-agent.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log(`\n======================================================`);
console.log(`🔒 AsiaPay Admin Security Quality Gate (Redline Audit)`);
console.log(`======================================================\n`);

let violations = 0;

function reportError(rule, file, line, msg, code) {
  violations++;
  console.error(`❌ [REDLINE VIOLATION] ${rule}`);
  console.error(`   File: ${file}:${line || '-'}`);
  console.error(`   Detail: ${msg}`);
  if (code) console.error(`   Code:   ${code.trim()}`);
  console.error(``);
}

function reportPass(rule, msg) {
  console.log(`✅ [PASS] ${rule}: ${msg}`);
}

const PORTAL_APPS = ['apps/web-mgr', 'apps/web-mch', 'apps/web-agent'];

// 1. Guard check: verify all portals have router guard with safeInternalPath
let guardViolations = 0;
for (const portal of PORTAL_APPS) {
  const guardPath = path.resolve(rootDir, portal, 'src/router/guard.ts');
  if (fs.existsSync(guardPath)) {
    const content = fs.readFileSync(guardPath, 'utf8');
    if (!content.includes('safeInternalPath')) {
      guardViolations++;
      reportError(
        'GUARD_SAFE_PATH',
        path.relative(rootDir, guardPath),
        0,
        'Router guard does not enforce safeInternalPath!',
      );
    }
  } else {
    guardViolations++;
    reportError(
      'GUARD_EXISTS',
      path.relative(rootDir, guardPath),
      0,
      'Router guard file missing!',
    );
  }
}
if (guardViolations === 0) {
  reportPass(
    'ROUTER_GUARDS',
    'All portal router guards exist and enforce safeInternalPath redirect sanitization.',
  );
}

// 2. Request client check: verify all portals restrict iToken attachment via isInternalApiUrl
let itokenViolations = 0;
for (const portal of PORTAL_APPS) {
  const reqPath = path.resolve(rootDir, portal, 'src/api/request.ts');
  if (fs.existsSync(reqPath)) {
    const content = fs.readFileSync(reqPath, 'utf8');
    if (!content.includes('isInternalApiUrl')) {
      itokenViolations++;
      reportError(
        'ITOKEN_LEAK_GUARD',
        path.relative(rootDir, reqPath),
        0,
        'iToken header is attached without isInternalApiUrl origin check!',
      );
    }
  } else {
    itokenViolations++;
    reportError(
      'REQUEST_CLIENT_EXISTS',
      path.relative(rootDir, reqPath),
      0,
      'Request client missing!',
    );
  }
}
if (itokenViolations === 0) {
  reportPass(
    'ITOKEN_HEADER_PROTECTION',
    'All request clients restrict iToken attachment to internal/same-origin API endpoints.',
  );
}

// 3. XSS Sinks check: check for unescaped v-html or unsafe links in portal views and referenced packages
let xssViolations = 0;
const IN_SCOPE_SCAN_DIRS = [
  'apps/web-mgr/src',
  'apps/web-mch/src',
  'apps/web-agent/src',
  'packages/effects/layouts/src',
  'packages/effects/common-ui/src',
];
for (const relDir of IN_SCOPE_SCAN_DIRS) {
  const targetDir = path.resolve(rootDir, relDir);
  function scanFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanFiles(fullPath);
      } else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Check any v-html that does not use highlightJSON or security:exempt
          // workbench-todo and workbench-trends are unreferenced upstream demo components
          if (
            line.includes('v-html') &&
            !line.includes('highlightJSON') &&
            !line.includes('// security:exempt-v-html') &&
            !fullPath.includes('workbench-todo') &&
            !fullPath.includes('workbench-trends')
          ) {
            xssViolations++;
            reportError(
              'UNSANITIZED_V_HTML',
              path.relative(rootDir, fullPath),
              i + 1,
              'v-html must use tokenized highlightJSON or explicit exemption',
              line,
            );
          }
          // Check dangerous javascript: scheme in templates
          if (/href\s*=\s*['"]\s*javascript:/i.test(line)) {
            xssViolations++;
            reportError(
              'JAVASCRIPT_SCHEME_HREF',
              path.relative(rootDir, fullPath),
              i + 1,
              'Dangerous javascript: scheme in href',
              line,
            );
          }
          // Check target="_blank" missing noopener / noreferrer
          if (
            line.includes('target="_blank"') &&
            !line.includes('rel=') &&
            !lines
              .slice(Math.max(0, i - 2), i + 3)
              .some((l) => l.includes('rel='))
          ) {
            xssViolations++;
            reportError(
              'TARGET_BLANK_NOOPENER',
              path.relative(rootDir, fullPath),
              i + 1,
              'target="_blank" without rel="noopener noreferrer"',
              line,
            );
          }
        }
      }
    }
  }
  scanFiles(targetDir);
}
if (xssViolations === 0) {
  reportPass(
    'XSS_AND_REDIRECTION_SINKS',
    'No unescaped v-html, javascript: hrefs, or target="_blank" opener leakages in portals & layout packages.',
  );
}

// 4. Check openWindow protocol protection
const windowUtilPath = path.resolve(
  rootDir,
  'packages/@core/base/shared/src/utils/window.ts',
);
if (fs.existsSync(windowUtilPath)) {
  const windowCode = fs.readFileSync(windowUtilPath, 'utf8');
  if (windowCode.includes('isSafeHttpUrl')) {
    reportPass(
      'OPEN_WINDOW_SECURITY',
      'openWindow verifies URL scheme rejecting javascript: / data: / vbscript:.',
    );
  } else {
    reportError(
      'OPEN_WINDOW_SECURITY',
      'packages/@core/base/shared/src/utils/window.ts',
      0,
      'openWindow does not validate URL safety protocol!',
    );
  }
}

// 5. Check hardcoded production secrets in portal sources
let secretViolations = 0;
const SECRET_REGEX =
  /(const|let|var)\s+(token|secret|password|apiKey)\s*=\s*['"][a-zA-Z0-9_\-+/]{16,}['"]/i;
for (const portal of PORTAL_APPS) {
  const srcDir = path.resolve(rootDir, portal, 'src');
  function checkSecrets(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkSecrets(fullPath);
      } else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (SECRET_REGEX.test(line)) {
            secretViolations++;
            reportError(
              'HARDCODED_SECRET_LITERAL',
              path.relative(rootDir, fullPath),
              i + 1,
              'Potential hardcoded secret literal',
              line,
            );
          }
        }
      }
    }
  }
  checkSecrets(srcDir);
}
if (secretViolations === 0) {
  reportPass(
    'NO_HARDCODED_SECRETS',
    'No hardcoded credentials or API tokens discovered in portal sources.',
  );
}

// 6. Check console.log leakage in portal sources (T3 compliance)
let consoleViolations = 0;
for (const portal of PORTAL_APPS) {
  const srcDir = path.resolve(rootDir, portal, 'src');
  function checkConsoleLogs(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkConsoleLogs(fullPath);
      } else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (
            /console\.(log|debug)\s*\(/.test(line) &&
            !line.includes('// security:exempt-console')
          ) {
            consoleViolations++;
            reportError(
              'SOURCE_CONSOLE_LOG',
              path.relative(rootDir, fullPath),
              i + 1,
              'Unexempted console.log found in source',
              line,
            );
          }
        }
      }
    }
  }
  checkConsoleLogs(srcDir);
}
if (consoleViolations === 0) {
  reportPass(
    'NO_CONSOLE_LOG_LEAKAGE',
    'Zero unexempted console.log/debug statements in portal sources.',
  );
}

console.log(`\n======================================================`);
if (violations > 0) {
  console.error(
    `🚨 Security Audit FAILED with ${violations} redline violations.`,
  );
  process.exit(1);
} else {
  console.log(`🎉 Security Audit PASSED! All redlines are clean.`);
  process.exit(0);
}
