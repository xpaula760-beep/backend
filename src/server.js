import app from './app.js';
import { connectDB } from './config/db.js';
import { seedAdmin } from './seed/admin.seed.js';
import { allowedOrigins } from './config/cors.js';

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error(JSON.stringify({
    time: new Date().toISOString(),
    level: 'fatal',
    type: 'uncaughtException',
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined
  }, null, 2));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(JSON.stringify({
    time: new Date().toISOString(),
    level: 'error',
    type: 'unhandledRejection',
    reason: reason && reason.stack ? reason.stack : reason
  }, null, 2));
});

connectDB()
  .then(() => seedAdmin())
  .then(() => {
    console.log('Allowed CORS origins:', allowedOrigins);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });
