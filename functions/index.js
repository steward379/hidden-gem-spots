/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.addNewMapNotification = functions.firestore
    .document('publishedMaps/{userId}/maps/{mapId}')
    .onCreate((snap, context) => {
        
        // 您的邏輯來處理新地圖的發佈
        const newMap = snap.data();
        const userId = context.params.userId;
        const mapId = context.params.mapId;

        // 您可以在這裡發送通知、更新統計數據等
        // console.log(`New map published by user ${userId}: ${mapId}`, newMap);

        // 假設您有一個全域通知集合
        const notificationRef = admin.firestore().collection('globalNotifications');
        return notificationRef.add({
            type: 'newMap',
            mapId: mapId,
            userId: userId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            // 其他您想包含的資訊
        });
    });


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
