const admin = require("firebase-admin");
const serviceAccount = require("./platform2learn-54f87-firebase-adminsdk-epft1-b5e08cc764.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (registrationTokens, notification) => {
  try {
    const messages = registrationTokens.map((token) => ({
      notification,
      token,
    }));

    const response = await admin.messaging().sendAll(messages);

    console.log("Successfully sent notifications:", response);
    return response;
  } catch (error) {
    console.error("Error sending notifications:", error);
    return null;
  }
};

const main = async () => {
  const db = admin.firestore();
  const userFcmRef = db.collection("UserFcmToken"); // Assuming the collection is named "UserFcm"

  // Query Firestore to get FCM tokens of users
  const querySnapshot = await userFcmRef.get();
  const fcmTokens = [];
  querySnapshot.forEach((doc) => {
    const fcmToken = doc.get("FcmToken");
    if (fcmToken) {
      fcmTokens.push(fcmToken);
    }
  });

  const notificationPayload = {
    title: "Hii Students",
    body: "New Course Arrived",
    imageUrl: "https://wallpaperaccess.com/full/393752.jpg",
  };

  const response = await sendNotification(fcmTokens, notificationPayload);

  if (response) {
    // Filter out invalid tokens
    const invalidTokens = [];
    response.responses.forEach((res, index) => {
      if (!res.success) {
        console.error(
          `Failed to send notification to FCM token ${fcmTokens[index]}`
        );
        console.error(res.error);
        invalidTokens.push(fcmTokens[index]);
      }
    });

    // Remove invalid tokens from the array
    const validTokens = fcmTokens.filter(
      (token) => !invalidTokens.includes(token)
    );

    // You can handle the invalid tokens here, for example, remove them from the Firestore collection
    // if (invalidTokens.length > 0) {
    //   invalidTokens.forEach(async (token) => {
    //     const querySnapshot = await userFcmRef
    //       .where("FcmToken", "==", token)
    //       .get();
    //     querySnapshot.forEach(async (doc) => {
    //       await doc.ref.delete();
    //     });
    //   });
    // }

    console.log("Valid tokens:", validTokens);
  }
};

// Call the main function
main();
