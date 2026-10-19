const app = require('./app');
const connectDB = require('./config/db');
const { port } = require('./config');
const { ensureDefaultCategories } = require('./utils/initDefaults');

const start = async () => {
  await connectDB();
  await ensureDefaultCategories();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
