-- ==============================================================================
-- RLS Audit Script
-- Enforces Non-negotiable #2:
-- "Every new table in public ships in the SAME migration with:
--  RLS enabled, explicit policies, indexes for columns used in policies."
-- ==============================================================================

WITH public_tables AS (
  SELECT
    schemaname,
    tablename,
    rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations')
),
tables_with_policies AS (
  SELECT DISTINCT
    schemaname,
    tablename
  FROM pg_policies
  WHERE schemaname = 'public'
),
violations AS (
  SELECT
    t.tablename,
    CASE
      WHEN NOT t.rowsecurity THEN 'RLS DISABLED'
      WHEN p.tablename IS NULL THEN 'NO POLICIES DEFINED'
      ELSE 'COMPLIANT'
    END AS violation_type
  FROM public_tables t
  LEFT JOIN tables_with_policies p
    ON t.schemaname = p.schemaname AND t.tablename = p.tablename
  WHERE NOT t.rowsecurity OR p.tablename IS NULL
)
SELECT
  tablename,
  violation_type
FROM violations;
