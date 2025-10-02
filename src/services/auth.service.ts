/**
 * Auth Service - Now uses Appwrite
 * This file maintains backward compatibility by re-exporting Appwrite auth
 */

export { AppwriteAuthService as AuthService } from './appwrite-auth.service';
export { AppwriteAuthService as default } from './appwrite-auth.service';
