import fs from 'fs';
import path from 'path';

/**
 * Static & Runtime RLS Auditor
 * Checks migration files to ensure every newly created public table:
 * 1. Has 'ENABLE ROW LEVEL SECURITY'
 * 2. Has at least one 'CREATE POLICY' defined in the exact same migration
 */

function auditMigrations(migrationsDir: string) {
  if (!fs.existsSync(migrationsDir)) {
    console.log('[RLS Audit] No migrations directory found yet. Skipping static audit.');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  let totalViolations = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi);

    for (const match of tableMatches) {
      const tableName = match[1];
      if (tableName === 'schema_migrations') continue;

      const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
      const policyRegex = new RegExp(`CREATE\\s+POLICY\\s+(?:"[^"]+"|\\S+)\\s+ON\\s+(?:public\\.)?${tableName}`, 'i');

      const hasRls = rlsRegex.test(content);
      const hasPolicy = policyRegex.test(content);

      if (!hasRls || !hasPolicy) {
        console.error(`❌ [RLS Audit Violation] Table '${tableName}' in '${file}':`);
        if (!hasRls) console.error(`   - Missing 'ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY'`);
        if (!hasPolicy) console.error(`   - Missing 'CREATE POLICY ... ON ${tableName}'`);
        totalViolations++;
      } else {
        console.log(`✅ [RLS Audit Compliant] Table '${tableName}' in '${file}' has RLS & policies.`);
      }
    }
  }

  if (totalViolations > 0) {
    console.error(`\n🚨 RLS Audit Failed with ${totalViolations} violation(s).`);
    process.exit(1);
  }

  console.log('✅ RLS static migration audit passed with 0 violations.');
}

const migrationsDir = path.resolve(import.meta.dirname, '../supabase/migrations');
auditMigrations(migrationsDir);
