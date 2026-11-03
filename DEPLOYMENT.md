## Deploying to Vercel

The repo deploys as **one Vercel project**: `frontend/dist` is served from the
CDN and every `/api/*` request is handled by a single catch-all Function that
wraps the Express app (`api/[...path].js` → `backend/server/app.js`).

### 1. Import the repository

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repo.
2. Keep the **project root** as the repository root.
3. `vercel.json` already sets the framework, build command and output dir, so
   the defaults below are applied automatically:
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`
4. Before the first deploy, open **Settings → Environment Variables** and add:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | TiDB/MySQL connection string |
| `JWT_SECRET` | yes | long random string |
| `ADMIN_EMAIL` | yes | initial admin email |
| `ADMIN_PASSWORD` | yes | at least 8 characters |
| `VITE_UPI_VPA` | yes* | UPI ID used by the simulated checkout |
| `VITE_UPI_PAYEE` | yes* | payee name for the UPI QR |
| `ALLOWED_ORIGINS` | no | extra cross-origin frontends, comma-separated |
| `DB_CONNECTION_LIMIT` | no | defaults to `2` on Vercel |
| `UPLOAD_DIR` | no | defaults to `/tmp/loanledger-uploads` on Vercel |

\* Add the `VITE_*` values for **Production** and **Preview**. They are baked
into the frontend at build time, so changing them requires a redeploy.

### 2. Deploy

```bash
npx vercel login          # once
npx vercel                # preview deployment
npx vercel --prod         # production deployment
```

Or push to `main` after connecting the Git repository — Vercel deploys
automatically.

### 3. Verify

```bash
curl https://<your-app>.vercel.app/api/health
curl https://<your-app>.vercel.app/api/plans
```

Then open the site, log in, and create an application.

### Serverless notes

- **Database schema** is created and seeded automatically on the first request
  of each cold Function instance.
- **Uploads are ephemeral on Vercel.** The filesystem is read-only except for
  `/tmp`, so documents are written to `/tmp/loanledger-uploads`. They survive
  only for the lifetime of that Function instance. For durable KYC documents,
  switch the multer storage in `backend/server/routes/customer.js` to S3/R2/
  Vercel Blob (or set `UPLOAD_DIR` to a mounted writable path).
- Keep `.env` files out of Git; Vercel environment variables replace them.

