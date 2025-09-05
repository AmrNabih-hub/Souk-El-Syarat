/**
 * Firebase Functions for Souk El-Syarat
 * Complete backend functions including email services
 */

import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";

// Import email functions
export {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendVendorApplicationEmail,
  sendVendorApplicationStatusEmail,
  sendPasswordResetEmail,
  sendCustomEmail,
  testEmail,
} from './emailFunctions';

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

logger.info("Firebase Functions initialized successfully");
