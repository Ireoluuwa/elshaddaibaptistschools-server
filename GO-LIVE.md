# Go-live runbook

Moves the live Supabase database and both Vercel apps onto the new release (sessions & terms, promotion, bursary, staff profiles). Do it out of school hours; it takes about 30 minutes.

Throughout, `LIVE_URL` is the live connection string from Supabase → Project Settings → Database (use the **session pooler** URL, port 5432).

```bash
export LIVE_URL='postgres://postgres.xxxx:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
```

> `.env.local` points at the dev database and wins over `.env`, so every live command below passes `DATABASE_URL="$LIVE_URL"` explicitly. A shell variable beats both files.

## 1. Before you start

- [ ] `npm run build` and `npm run test:e2e` pass in the server; `npm run build` passes in the UI.
- [ ] Nobody is entering results (tell the teachers).
- [ ] You have the Supabase dashboard open in case you need to restore.

## 2. Back up the live database

```bash
pg_dump "$LIVE_URL" --no-owner --no-acl -Fc -f backups/live-$(date +%Y%m%d-%H%M).dump
pg_restore --list backups/live-*.dump | head   # check it isn't empty
```

Keep this file until the release has run for a full term. To roll back: `pg_restore --clean --no-owner -d "$LIVE_URL" backups/live-….dump`.

## 3. Check the live tables match `InitialSchema`

The live database was created before migrations existed, so its tables should already match the first migration. Confirm that before telling TypeORM to skip it:

```bash
# Build a scratch database that has only InitialSchema applied
createdb schema_check
export CHECK_URL=postgres://localhost:5432/schema_check
psql "$CHECK_URL" -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
DATABASE_URL="$CHECK_URL" npm run migration:run
for i in $(seq 8); do DATABASE_URL="$CHECK_URL" npm run migration:revert; done

pg_dump --schema-only --no-owner --no-acl "$CHECK_URL" -n public > /tmp/expected.sql
pg_dump --schema-only --no-owner --no-acl "$LIVE_URL" -n public > /tmp/live.sql
diff <(grep -E '^(CREATE|ALTER|    ")' /tmp/expected.sql | sort) <(grep -E '^(CREATE|ALTER|    ")' /tmp/live.sql | sort)
dropdb schema_check
```

Differences in constraint names alone are fine. A **missing table or column** on live means stop: fix it by hand first, or ask before continuing.

## 4. Mark `InitialSchema` as already applied

```bash
psql "$LIVE_URL" <<'SQL'
CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, name varchar NOT NULL);
INSERT INTO migrations ("timestamp", name)
SELECT 1791195044944, 'InitialSchema1791195044944'
WHERE NOT EXISTS (SELECT 1 FROM migrations WHERE name = 'InitialSchema1791195044944');
SQL
```

## 5. Run the remaining migrations

```bash
DATABASE_URL="$LIVE_URL" ALLOW_REMOTE_MIGRATIONS=yes npm run migration:show   # 8 pending, InitialSchema ticked
DATABASE_URL="$LIVE_URL" ALLOW_REMOTE_MIGRATIONS=yes npm run migration:run
```

They run in one transaction: if any fails, nothing changes. What they do to existing data:

| Migration | Effect on live data |
| --- | --- |
| AddTermStatusAndReportDetails | Current term → `active`, earlier terms → `closed`, later → `upcoming` |
| AddEnrollments | One enrollment per student for the current session, from their current class |
| RemoveDuplicateCurriculumMappings | Deletes duplicate class↔subject rows (keeps one) |
| AddStaffProfilesAndLastLogin | New `staff_profiles` table, `users.lastLoginAt` |
| AddVpRemarkToResults | New nullable column |
| AddPromotionLinks | JSS1→JSS2→JSS3→SS1→SS2→SS3 |
| AddBursary | New `class_bills`, `student_fees` tables (empty) |
| AddStaffProfileDetails | New nullable columns |

## 6. Seed the staff accounts

```bash
psql "$LIVE_URL" -f database/seeds/12-staff-accounts.sql
```

Creates `EBS/ADM/001` and `EBS/BUR/001` with temporary passwords (skipped if they exist). Change both passwords on first sign-in from the Profile page.

## 7. Check the data

```bash
psql "$LIVE_URL" -c "SELECT y.name, t.name, t.status FROM terms t JOIN academic_years y ON y.id = t.\"academicYearId\" ORDER BY t.\"startDate\""
psql "$LIVE_URL" -c "SELECT count(*) FROM enrollments"            # = number of students with a class
psql "$LIVE_URL" -c "SELECT name, \"nextClassId\" IS NOT NULL AS linked FROM school_classes ORDER BY name"
```

Exactly one term should be `active`, and it should be the real current term.

## 8. Deploy

**Server (Vercel project for `elshaddaibaptistschools-server`)**: environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `LIVE_URL` (transaction pooler, port 6543, is fine for the app) |
| `JWT_SECRET` | unchanged from today |
| `JWT_EXPIRATION` | e.g. `1d` |
| `FRONTEND_URL` | `https://elshaddaibaptistschools.com` (the `www.` form is added automatically) |

Don't set `ALLOW_REMOTE_MIGRATIONS` on Vercel. `vercel.json` hard-codes `Access-Control-Allow-Origin` to the `www.` domain. If the site is also served without `www.`, redirect that domain to `www.` in Vercel → Domains.

**UI (Vercel project for `elshaddaibaptistschools-ui`)**: check:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | the server's URL, ending in `/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.elshaddaibaptistschools.com` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | unchanged |

`NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them. Deploy the **server first**, then the UI.

## 9. Smoke test (about 10 minutes)

- [ ] Admin signs in → Dashboard loads; Sessions & Terms shows the right active term.
- [ ] Admin → Profile: upload a signature (tests the Supabase `profile_image` bucket), then Sessions → report details → "Use my saved signature".
- [ ] A teacher signs in and sees only active students in their class; save one draft result.
- [ ] Bursar signs in → set a bill for one class; set an outstanding amount for a test student.
- [ ] That student sees "result on hold"; clear the fee → the report sheet shows and the PDF downloads.
- [ ] Undo any test data you entered.

## If something goes wrong

- **Migration failed:** nothing was applied (single transaction). Read the error, fix, rerun step 5.
- **App broken after deploy:** in Vercel, promote the previous deployment of both projects. Then restore the backup from step 2 only if the old app can't read the migrated tables (new columns are additive, so this is unlikely).
