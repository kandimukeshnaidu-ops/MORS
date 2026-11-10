import fs from 'fs';
import path from 'path';

/**
 * MORS Check-RLS Guardrail (v3)
 * Asserts every table created in public has:
 * 1. ALTER TABLE ... ENABLE ROW LEVEL SECURITY
 * 2. At least one explicit CREATE POLICY defined in the exact same migration
 */

function auditMigrations(migrationsDir: string) {
  if (!fs.existsSync(migrationsDir)) {
    console.log('[check:rls] No migrations directory found. Skipping check.');
    return;
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  let totalViolations = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const tableMatches = content.matchAll(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi
    );

    for (const match of tableMatches) {
      const tableName = match[1];
      if (tableName === 'schema_migrations') continue;

      const rlsRegex = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        'i'
      );
      const policyRegex = new RegExp(
        `CREATE\\s+POLICY\\s+(?:"[^"]+"|\\S+)\\s+ON\\s+(?:public\\.)?${tableName}`,
        'i'
      );

      const hasRls = rlsRegex.test(content);
      const hasPolicy = policyRegex.test(content);

      if (!hasRls || !hasPolicy) {
        console.error(`❌ [check:rls VIOLATION] Table '${tableName}' in '${file}':`);
        if (!hasRls) console.error(`   - Missing 'ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY'`);
        if (!hasPolicy) console.error(`   - Missing 'CREATE POLICY ... ON ${tableName}'`);
        totalViolations++;
      } else {
        console.log(`✅ [check:rls] Table '${tableName}' in '${file}' has RLS & policies.`);
      }
    }
  }

  if (totalViolations > 0) {
    console.error(`\n🚨 check:rls failed with ${totalViolations} violation(s).`);
    process.exit(1);
  }

  console.log('✅ check:rls passed with 0 violations.');
}

const migrationsDir = path.resolve(import.meta.dirname, '../supabase/migrations');
auditMigrations(migrationsDir);
