import app from './app.js';
import { connectDB } from './config/db.js';
import { seedAdmin } from './seed/admin.seed.js';
import { allowedOrigins } from './config/cors.js';

const PORT = process.env.PORT || 5000;

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
