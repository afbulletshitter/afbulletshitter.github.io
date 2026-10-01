# Supabase production safeguards

The GitHub Pages deployment and the Supabase database are separate systems. A
normal site deployment must never modify or recreate production tables.

## Before every database migration

1. Confirm the migration is additive whenever possible. Prefer new columns,
   indexes, or policies over dropping or renaming existing objects.
2. Create or verify a current Supabase database backup. On plans that support
   it, enable point-in-time recovery before a high-risk migration.
3. Export `public.profiles`, `public.bullets`, and `public.reports` as an
   additional logical backup.
4. Test the SQL in a separate Supabase project or database branch.
5. Review the SQL for `drop`, `truncate`, `delete`, destructive `alter table`,
   and changes to foreign-key cascade behavior.
6. Apply the migration once, verify row counts, and test one signed-in account.

## Invariants to preserve

- Keep the production project URL stable unless a deliberate migration is
  planned.
- Keep `profiles.user_id`, `bullets.user_id`, and `reports.user_id` linked to
  `auth.users(id)`.
- Keep row-level security enabled on all three tables.
- Keep owner-only policies based on `auth.uid() = user_id`.
- Never expose the Supabase service-role key in browser code or GitHub.
- Do not change browser storage keys without a versioned data migration.

## Deployment checklist

1. Confirm `https://afbulletshitter.github.io/` is the Supabase Site URL.
2. Confirm `https://afbulletshitter.github.io/**` is an allowed redirect URL.
3. Sign in with a test account.
4. Save a bullet and an EPB/OPB; wait for "Saved to your account."
5. Sign out, clear the site's local storage, sign in again, and verify both
   records reload from Supabase.
6. Delete the test records and verify they remain deleted after another sign-in.

