/**
 * COMPLETE Firebase Cloud Functions Backend
 * Full implementation for Souk El-Syarat
 */
import * as functions from 'firebase-functions';
export declare const api: functions.HttpsFunction;
export declare const onUserCreated: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
export declare const onOrderStatusUpdate: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
export declare const dailyAnalytics: functions.CloudFunction<unknown>;
//# sourceMappingURL=index.d.ts.map