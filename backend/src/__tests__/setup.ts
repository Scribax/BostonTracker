// ==========================================
// JEST SETUP - Test Configuration
// ==========================================

import { sequelize } from '@config/database';

// Global setup before all tests
beforeAll(async () => {
  // Test database connection
  await sequelize.authenticate();
});

// Clean up after each test
afterEach(async () => {
  // Clean up test data if needed
  // await sequelize.truncate({ cascade: true });
});

// Close database connection after all tests
afterAll(async () => {
  await sequelize.close();
});
