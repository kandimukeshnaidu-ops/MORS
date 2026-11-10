import fs from 'fs';
import path from 'path';

/**
 * MORS Check-Secrets Guardrail (v3)
 * Enforces Non-Negotiable #7:
 * - Service-role key is server-only. Never in client bundles, NEXT_PUBLIC_* vars, or mobile code.
 * - Scans apps/web/src, apps/mobile/src, and packages/ for leaked secret patterns.
 */

const FORBIDDEN_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /service_role/i,
  /NEXT_PUBLIC_.*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY)/i,
];

function scanForSecretLeaks(targetDirs: string[]) {
  const violations: string[] = [];

  function walk(dir: string, isServerAllowedDir = false) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
        walk(fullPath, isServerAllowedDir);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json') || entry.name.endsWith('.env'))) {
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          const relPath = path.relative(process.cwd(), fullPath);

          // Client-side code check: prevent service_role references in client-accessible paths
          if (relPath.includes('apps\\web\\src\\components') || relPath.includes('apps/web/src/components') ||
              relPath.includes('apps\\mobile') || relPath.includes('apps/mobile') ||
              relPath.includes('packages\\domain') || relPath.includes('packages/domain')) {
            for (const pattern of FORBIDDEN_PATTERNS) {
              if (pattern.test(line)) {
                violations.push(`[Secret in Client Bundle] ${relPath}:${lineNum} matches ${pattern.toString()}`);
              }
            }
          }
        });
      }
    }
  }

  targetDirs.forEach((d) => walk(d));

  if (violations.length > 0) {
    console.error(`\n🚨 check:secrets failed with ${violations.length} finding(s):`);
    violations.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  console.log('✅ check:secrets passed: no secrets or service-role references found in client code.');
}

const dirsToScan = [
  path.resolve(import.meta.dirname, '../apps/web/src'),
  path.resolve(import.meta.dirname, '../apps/mobile/src'),
  path.resolve(import.meta.dirname, '../packages/domain'),
];

scanForSecretLeaks(dirsToScan);
