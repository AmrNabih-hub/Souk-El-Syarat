import 'reflect-metadata';

// Global test setup
beforeAll(async () => {
  // Setup any global test configuration
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('Cleaning up test environment...');
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'customer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  createMockLoginDto: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  }),
  
  createMockRegisterDto: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    role: 'customer',
    ...overrides,
  }),
  
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};