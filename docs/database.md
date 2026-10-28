# Database installation

## New Supabase project

Run `supabase/migrations/202610280001_initial_schema.sql` once through the SQL Editor or your established migration workflow. The transaction creates:

- `user_data`: one row per account, with a unique UUID device token.
- `feed_schedule`: validated daily meal rows and a unique account/hour/minute constraint.
- Auth signup trigger and a backfill for accounts that already exist.
- Owner-scoped SELECT policies and restricted table privileges.
- `replace_feed_schedule(jsonb)`, `get_device_schedule(text)`, `rotate_device_token()`.

No service-role key is required by the application. Configure email/GitHub auth and allowed callback URLs in Supabase separately.

## Existing installation

The source web repository did not include its deployed SQL schema, migrations, RLS policies or trigger definitions. The initial migration deliberately uses plain CREATE statements and fails if these tables already exist. It does not guess how to alter a live database.

The API remains compatible with the original tables while these new functions are absent. Schedule writes use the authenticated user's existing table permissions, firmware reads use the original token lookup subject to existing anonymous policies, and token rotation updates only the signed-in account. Compatibility is activated only for PostgREST PGRST202; no schema or RLS changes are applied automatically. This path does not make multi-request schedule replacements fully transactional.

For an optional schema upgrade to the transactional RPC design:

1. Back up the database and export the definitions of `user_data`, `feed_schedule`, relevant policies, functions and auth triggers.
2. Rehearse in a separate Supabase project or database restored from the backup.
3. Compare column types and foreign keys with the initial schema. Check existing tokens are UUIDs, owner IDs reference auth users, and meal values meet the documented integer/range limits.
4. Resolve duplicate owner/time pairs and accounts with more than 10 meals through an explicit data migration. Preserve valid tokens and schedules.
5. Create/reconcile the functions and trigger in the supplied migration. Avoid installing a duplicate signup trigger.
6. Reconcile table privileges and policies: authenticated users should SELECT only their own rows; direct table writes and anonymous table access must be removed. Do not leave older permissive policies alongside new policies.
7. Verify signup, both accounts' isolation, saving/removing meals, token reads and rotation before switching the web app.

Because no live database credentials or schema were provided, no remote migration has been executed. Share the existing schema export to prepare an installation-specific migration without guessing.

## Local tests

`npm test` starts an isolated PostgreSQL engine through PGlite, creates minimal Supabase-compatible auth roles/functions, then applies the actual migration file. It checks signup provisioning, RLS, direct-write denial, validation, rollback preservation, empty schedules, device reads and old-token rejection.

These tests exercise PostgreSQL permissions and functions, but do not replace a rehearsal with the deployed Supabase Auth and PostgREST configuration.
