require('dotenv/config');
const { run } = require('./dist/index.js');

run().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});