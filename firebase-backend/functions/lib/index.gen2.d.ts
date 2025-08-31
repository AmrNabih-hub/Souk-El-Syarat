/**
 * GEN2 CLOUD FUNCTIONS - PROFESSIONAL IMPLEMENTATION
 * Enhanced Performance, Security, and Scalability
 */
export declare const api: import("firebase-functions/v2/https").HttpsFunction;
export declare const promoteUser: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
export declare const onProductCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot, {
    productId: string;
}>>;
export declare const processProductImage: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/storage").StorageEvent>;
export declare const dailyReports: import("firebase-functions/v2/scheduler").ScheduleFunction;
export declare const processAsyncTask: import("firebase-functions/core").CloudFunction<import("firebase-functions/core").CloudEvent<import("firebase-functions/v2/pubsub").MessagePublishedData<any>>>;
//# sourceMappingURL=index.gen2.d.ts.map