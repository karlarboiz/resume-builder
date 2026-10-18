# Resume Builder

Next.js app for creating, rewriting, exporting, and sharing resumes.

## Run locally

```bash
npm install
cp .env.example .env
# Put a long random value in AUTH_SECRET
npm run dev
```

`npm run dev` starts a local Postgres on port 5433 when Docker is not available, applies the Prisma schema, and opens the app at http://127.0.0.1:3000.

Sign in with an email. In development, without `EMAIL_SERVER`, the magic link is shown on the sign-in page.

## Optional services

- `OPENAI_API_KEY` turns on GPT-4o section rewrites and Whisper transcription.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` and `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` enable those sign-in buttons.
- `EMAIL_SERVER` sends magic links through SMTP.
- `S3_*` variables upload exported files to S3 or Cloudflare R2. Exports are also saved in `data/exports`.
- `docker compose up -d` can replace the embedded database. Point `DATABASE_URL` at that Postgres instance.
