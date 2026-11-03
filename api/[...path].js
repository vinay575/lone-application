import app from '../backend/server/app.js';

// Catch-all Vercel Function: every /api/* request (including nested routes such
// as /api/auth/login) is handled by the existing Express application.
export default app;
