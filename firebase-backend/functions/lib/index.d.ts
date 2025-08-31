/**
 * Firebase Cloud Functions - Production Backend
 * Souk El-Sayarat Real Backend Server
 */
import * as functions from 'firebase-functions';
export declare const api: functions.HttpsFunction;
export declare const onOrderCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onVendorApplication: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const dailyAnalytics: functions.CloudFunction<unknown>;
export declare const getUploadUrl: functions.HttpsFunction & functions.Runnable<any>;
//# sourceMappingURL=index.d.ts.map