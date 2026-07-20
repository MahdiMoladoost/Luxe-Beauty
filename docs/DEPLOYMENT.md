# Deployment

Target local URL: `http://localhost:5000`

## Local npm workflow (target)
1. Copy `.env.example` to an ignored local environment file and set development-only values.
2. Start PostgreSQL, Redis and MinIO.
3. Install exact dependencies from the lockfile.
4. Validate Prisma schema and apply development migrations.
5. Run development-only seed.
6. Start web on port 5000 and worker as a separate process.

Planned commands:

```bash
npm ci
npm run db:validate
npm run db:migrate:dev
npm run db:seed
npm run dev
npm run worker:dev
```

## Docker workflow (target)

```bash
docker compose up --build
```

Services:
- `web`: Next.js application on internal port 5000
- `worker`: queue consumers and scheduled jobs
- `postgres`: persistent PostgreSQL data
- `redis`: queue/cache/rate-limit support
- `minio`: development object storage
- `minio-init`: creates required development buckets/policies
- `nginx`: production-like routing and security headers

## Production principles
- Build immutable images in CI.
- Run database migrations as an explicit release step, not concurrently from every web replica.
- Web and worker processes use separate least-privilege credentials where practical.
- Store secrets in the deployment secret manager, never image layers or Git.
- Terminate TLS at a trusted edge; enable HSTS only in HTTPS production.
- Serve public media through controlled storage/CDN configuration; private media only via signed URLs.
- Scale web and workers independently.
- Use managed PostgreSQL/Redis/object storage where operationally appropriate.

## Health endpoints
- `/api/health/live`: process is running; no expensive dependencies.
- `/api/health/ready`: database, required migrations and critical configuration ready.
- protected operational health: Redis, queues, object storage and adapter modes.

Health output must not expose credentials, internal stack traces or sensitive configuration.

## Database deployment
- Validate schema and migration history in CI.
- Back up before destructive/high-risk migrations.
- Prefer expand/migrate/contract for zero/low-downtime changes.
- Never use `prisma db push` as the production migration workflow.
- Record migration result and application version.

## Backups
- Encrypted scheduled PostgreSQL backups with configurable retention.
- Versioned object-storage lifecycle and backup policy appropriate to each namespace.
- Restore procedure includes a clean target, integrity checks, migration compatibility and smoke tests.
- Restore tests are scheduled; untested backups are not considered reliable.

## Observability
- Structured logs with correlation IDs.
- Error tracking adapter.
- Metrics for HTTP, DB, queue, jobs, payments, SMS, booking holds and external adapters.
- Queue dashboard with failed/retry/dead-letter visibility restricted to authorized admins.
- Alerting for booking/payment/ledger inconsistencies, migration failure, backup failure and external delivery degradation.

## CI/CD stages
Install/cache, lint, typecheck, unit, integration, Prisma validation, migration checks, build, security audit, Docker build and E2E in an isolated service environment. Real secrets are provided only through GitHub Secrets to environments that require them; mocks are used for ordinary CI.

## Rollback
Application rollback must remain compatible with the deployed schema. Data-changing releases require a documented forward-fix or reversible migration approach. Financial and booking records are never rolled back by deleting history.
