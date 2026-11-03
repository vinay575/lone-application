# Backend-only Vercel project

Use this when the Express API is deployed as its own Vercel project and the
frontend is hosted separately (Vercel, Netlify, etc.).

## Project settings

- **Root Directory:** `backend`
- **Framework Preset:** Express
- **Build Command:** leave empty (or disable the override)
- **Output Directory:** leave empty (or disable the override)
- **Install Command:** `npm install`
- **Node.js Version:** 22.x

`backend/index.js` imports the Express app from `backend/server/app.js` and
default-exports it, which is what Vercel's Express integration looks for.

## Environment variables

Add these in **Settings → Environment Variables** for Production and Preview:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | TiDB/MySQL connection string |
| `JWT_SECRET` | yes | long random string |
| `ADMIN_EMAIL` | yes | initial admin email |
| `ADMIN_PASSWORD` | yes | at least 8 characters |
| `ALLOWED_ORIGINS` | yes* | comma-separated frontend origins |
| `DB_CONNECTION_LIMIT` | no | defaults to `2` on Vercel |
| `UPLOAD_DIR` | no | defaults to `/tmp/loanledger-uploads` |

\* Required when the frontend is on a different domain. Example:

```env
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://yourdomain.com
```

Requests without an `Origin` header (curl, server-to-server) are allowed.

## Verify

```bash
curl https://your-backend.vercel.app/api/health
curl https://your-backend.vercel.app/api/plans
```

The API is available at the same paths as local development:

```
/api/auth/*
/api/customer/*
/api/admin/*
/api/health
/api/uploads/*   (auth required)
/uploads/*       (auth required)
```

## Point the frontend at this backend

In the frontend project, set:

```env
VITE_API_URL=https://your-backend.vercel.app/api
```

Then rebuild/redeploy the frontend (Vite bakes `VITE_*` values at build time).

## Notes

- Uploaded files go to `/tmp` and are **ephemeral** on Vercel. Use S3/R2/Vercel
  Blob for durable document storage.
- The database schema and seed data are created on the first request of each
  cold Function instance.
