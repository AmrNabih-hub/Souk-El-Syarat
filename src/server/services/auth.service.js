import admin from 'firebase-admin';

/**
 * Signs in a user with email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} The custom token for the user.
 */
export const signIn = async (email, password) => {
  // This is a placeholder. In a real application, you would verify the password.
  // For security reasons, Firebase Admin SDK does not handle password verification directly.
  // The client-side SDK should be used to sign in the user, and then the ID token
  // should be sent to the backend for verification.
  const user = await admin.auth().getUserByEmail(email);
  const customToken = await admin.auth().createCustomToken(user.uid);
  return customToken;
};

/**
 * Creates a new user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {string} displayName - The user's display name.
 * @returns {Promise<admin.auth.UserRecord>} The newly created user record.
 */
export const signUp = async (email, password, displayName) => {
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName,
  });
  return userRecord;
};
