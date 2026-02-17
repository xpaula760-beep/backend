const app = require('./app');
const { connectDB } = require('./config/db');
const { seedAdmin } = require('./seed/admin.seed');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => seedAdmin())
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });
