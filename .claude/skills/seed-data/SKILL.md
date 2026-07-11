---
name: seed-data
description: Add or modify seed data in the database schema
---

# Seed Data

Use this skill when adding or modifying seed data in the database.

## Steps

1. **Read `backend/schema.sql`** to see existing seed data
2. **Understand the table structure** — Check column types and constraints
3. **Add seed data** using `INSERT OR IGNORE` (idempotent):
   ```sql
   INSERT OR IGNORE INTO table_name (id, col1, col2) VALUES
   ('unique-id', 'value1', 'value2'),
   ('unique-id-2', 'value3', 'value4');
   ```
4. **Delete `backend/fraud_hub.db`** to reset the database
5. **Restart the backend** to re-seed

## Rules

- Always use `INSERT OR IGNORE` to prevent duplicate key errors
- Use descriptive IDs (e.g., `alert-001`, `game-1`)
- Keep seed data realistic and educational
- JSON arrays in TEXT columns must be valid JSON strings

## Example

```sql
-- Seed: scam_alerts
INSERT OR IGNORE INTO scam_alerts (id, title, category, description, date) VALUES
('alert-001', 'Fake KPay APK', 'Fake APK', 'Description here', '2026-07-01'),
('alert-002', 'KBZ Phishing', 'Phishing Link', 'Another description', '2026-06-28');
```

## Don'ts

- Don't use `INSERT` without `OR IGNORE` — causes errors on re-seed
- Don't use auto-increment IDs — use string IDs with prefixes
- Don't put sensitive data in seed files
