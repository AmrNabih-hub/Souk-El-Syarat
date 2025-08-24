/**
 * MSW (Mock Service Worker) Server Setup
 * Enterprise-grade API mocking for testing
 */

import { handlers } from './handlers';

export const server = setupServer(...handlers);
