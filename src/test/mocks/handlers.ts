/**
 * MSW Request Handlers
 * Mock API responses for testing
 */

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Firebase Auth endpoints
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', () => {
    return HttpResponse.json({
      localId: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
    });
  }),

  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signUp', () => {
    return HttpResponse.json({
      localId: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: '3600',
    });
  }),

  // Mock Firestore endpoints
  http.post(
    'https://firestore.googleapis.com/v1/projects/*/databases/(default)/documents:commit',
    () => {
      return HttpResponse.json({
        commitTime: new Date().toISOString(),
        writeResults: [{ updateTime: new Date().toISOString() }],
      });
    }
  ),

  http.get('https://firestore.googleapis.com/v1/projects/*/databases/(default)/documents/*', () => {
    return HttpResponse.json({
      name: 'projects/test/databases/(default)/documents/test/test-id',
      fields: {
        title: { stringValue: 'Test Product' },
        price: { integerValue: '1000' },
        description: { stringValue: 'Test Description' },
      },
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    });
  }),

  // Mock Storage endpoints
  http.post('https://firebasestorage.googleapis.com/v0/b/*/o', () => {
    return HttpResponse.json({
      name: 'test-file.jpg',
      bucket: 'test-bucket',
      downloadTokens: 'test-token',
    });
  }),

  // Mock external APIs
  http.get('https://api.example.com/products', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'BMW X5 2022',
        price: 1500000,
        category: 'cars',
        images: ['https://example.com/image1.jpg'],
      },
    ]);
  }),
];
