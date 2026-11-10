import fs from 'fs';
import path from 'path';

/**
 * MORS Check-NoFake Guardrail (v3)
 * Enforces "No Fake Functionality" per Section 7.8:
 * - Scans TSX/TS files in apps/web/src for:
 *   1. Empty onClick handlers (e.g. `onClick={() => {}}`)
 *   2. Dead placeholder links (e.g. `href="#"`)
 *   3. Mock data arrays in production code (outside tests/seed)
 * - Compares exceptions against scripts/allowed-placeholders.json
 */

function scanForNoFakeViolations(srcDir: string, allowedPlaceholders: string[]) {
  if (!fs.existsSync(srcDir)) {
    console.log('[check:nofake] Directory not found:', srcDir);
    return;
  }

  const violations: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          const relPath = path.relative(process.cwd(), fullPath);
          const location = `${relPath}:${lineNum}`;

          if (allowedPlaceholders.includes(location)) return;

          // 1. Empty onClick handler
          if (/onClick\s*=\s*\{(?:\(\)\s*=>\s*\{(?:\s*)\}|(?:undefined|null))\}/.test(line)) {
            violations.push(`[Empty onClick] ${location}: ${line.trim()}`);
          }

          // 2. Dead href="#"
          if (/href\s*=\s*["']#["']/.test(line)) {
            violations.push(`[Dead href="#"] ${location}: ${line.trim()}`);
          }

          // 3. Mock data declaration in component file
          if (/const\s+MOCK_\w+\s*=/.test(line)) {
            violations.push(`[Mock Data in App Code] ${location}: ${line.trim()}`);
          }
        });
      }
    }
  }

  walk(srcDir);

  if (violations.length > 0) {
    console.error(`\n🚨 check:nofake failed with ${violations.length} violation(s):`);
    violations.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  console.log('✅ check:nofake passed: zero fake controls or mock data found in app code.');
}

const allowedPath = path.resolve(import.meta.dirname, 'allowed-placeholders.json');
const allowed = fs.existsSync(allowedPath) ? JSON.parse(fs.readFileSync(allowedPath, 'utf-8')) : [];
const webSrc = path.resolve(import.meta.dirname, '../apps/web/src');

scanForNoFakeViolations(webSrc, allowed);
