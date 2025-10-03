// 🧪 Appwrite Integration Test Setup
// Sets up test environment for Appwrite services

import { beforeAll, afterAll, vi } from 'vitest'

// Mock Appwrite client for testing
const mockAppwriteClient = {
  setEndpoint: vi.fn().mockReturnThis(),
  setProject: vi.fn().mockReturnThis(),
  account: {
    create: vi.fn(),
    createEmailSession: vi.fn(),
    deleteSession: vi.fn(),
    get: vi.fn(),
  },
  databases: {
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    listDocuments: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  storage: {
    createFile: vi.fn(),
    getFile: vi.fn(),
    deleteFile: vi.fn(),
    getFilePreview: vi.fn(),
  },
  teams: {
    create: vi.fn(),
    list: vi.fn(),
  },
  functions: {
    createExecution: vi.fn(),
  }
}

// Mock the Appwrite module
vi.mock('appwrite', () => ({
  Client: vi.fn(() => mockAppwriteClient),
  Account: vi.fn(),
  Databases: vi.fn(),
  Storage: vi.fn(),
  Teams: vi.fn(),
  Functions: vi.fn(),
  ID: {
    unique: () => 'test-id-' + Date.now()
  },
  Permission: {
    read: vi.fn(),
    write: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  Role: {
    any: vi.fn(),
    user: vi.fn(),
    users: vi.fn(),
  }
}))

beforeAll(() => {
  // Set up test environment variables
  process.env.VITE_APPWRITE_ENDPOINT = 'https://test.appwrite.io/v1'
  process.env.VITE_APPWRITE_PROJECT_ID = 'test-project-id'
  process.env.VITE_APPWRITE_DATABASE_ID = 'test-database-id'
  
  // Mock console methods to reduce noise during tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterAll(() => {
  // Clean up
  vi.restoreAllMocks()
})

export { mockAppwriteClient }