const path = require('path');
const rootSeed = path.join(__dirname, '../../sample_data/seed.js');

const seed = require(rootSeed);

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;