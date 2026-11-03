// Vercel entry point for a backend-only project.
//
// Set the Vercel project's Root Directory to "backend". Vercel's Express
// integration looks for index.js (or app.js/server.js) that imports express
// and default-exports the app, then deploys the whole Express app as one
// Function. Local development still uses server/index.js (which listens on a
// port); this file only exports the app.
import express from 'express';
import app from './server/app.js';

// Referenced so the Express framework detector sees the dependency here.
void express;

export default app;
