/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
// const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

// The Firebase Admin SDK.
const admin = require("firebase-admin");
admin.initializeApp();
const firestore = admin.firestore();
const messaging = admin.messaging();


exports.processTasks = onSchedule("* * * * *", async (event) => {
  // exports.helloWorld = onRequest(async (request, response) => {
  logger.log(`Started function execution`);

  const currentTime = new Date();
  const tasksRef = firestore.collectionGroup("tasks");

  // Extend streaks
  logger.log(`Extending streaks`);
  const completedTasksQuerySnapshot = await tasksRef
    .where("streakExtendAt", "<=", currentTime)
    .get();

  completedTasksQuerySnapshot.forEach((doc) => {
    const task = doc.data();
    try {
      if ((task.lastCompletedAt.toDate().getTime() < currentTime.getTime() - (task.taskDuration * 60 * 1000))) {
        logger.debug(`Streak task ${doc.id} is not completed yet`);
        return;
      }

      logger.debug(`Updating the streak for task ${doc.id}`);

      // Update the streak
      doc.ref.update({
        streak: task.streak + 1,
        streakExtendAt: new Date(Date.now() + (task.taskDuration * 60 * 1000)),
      });
    } catch (e) {
      logger.error(`Error updating the streak for task ${doc.id}: ${e}`);
    }
  });

  // Send Reminders
  logger.log(`Sending reminders`);
  const querySnapshot = await tasksRef
    .where("nextReminder.time", "<=", currentTime)
    .get();

  querySnapshot.forEach(async (doc) => {
    const task = doc.data();
    try {
      task.id = doc.id;

      const userId = doc.ref.path.split("/")[1]; // Extract the userId from the document path

      // Retrieve user data to check push notification settings and tokens
      const userRef = firestore.collection("users").doc(userId);

      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const user = userDoc.data();
        await sendReminderNotification({ id: userDoc.id, ...user }, task);
      } else {
        logger.warn(`User ${userId} does not exist`);
      }

      // Set the next reminder
      const sortedReminders = task.reminders.sort((a, b) => a.time - b.time);
      const nextReminder = sortedReminders.shift() || null;
      doc.ref.update({
        nextReminder,
        reminders: sortedReminders,
      });
    } catch (e) {
      logger.error(`Error sending reminder for task ${doc.id}: ${e}`);
    }
  });


  // Reset expired tasks
  logger.log(`Resetting expired tasks`);
  const expiredTasksQuerySnapshot = await tasksRef
    .where("expiresAt", "<=", currentTime)
    .get();

  expiredTasksQuerySnapshot.forEach((doc) => {
    const task = doc.data();
    try {
      logger.debug(`Resetting the expired task ${doc.id}`);

      // Reset the task
      doc.ref.update({
        expiresAt: null,
        lastCompletedAt: null,
        streakStartedAt: null,
        streakExtendAt: null,
        streak: 0,
        nextReminder: null,
        reminders: [],
      });
    } catch (e) {
      logger.error(`Error resetting the expired task ${doc.id}: ${e}`);
    }
  });

  // response.send("Hello from Firebase!");
});

const sendReminderNotification = async (user, task) => {
  // Check if push notifications are enabled for the user
  if (!user.fcmTokens || user.fcmTokens.length === 0) {
    logger.debug(`No push notification tokens for user ${user.id}`);
    return;
  }

  logger.debug(`Sending push notification for task ${task.id} to user ${user.id}`);
  const notificationTitle = getNotificationTitle(task.nextReminder.type);
  let notificationBody = `Don't forget to ${task.text}!`
  if (task.nextReminder.type === "expired") {
    notificationBody = `Your streak for "${task.text}" has expired after ${task.streak} days.`
  }

  const message = {
    notification: {
      title: notificationTitle,
      body: notificationBody,
    },
    tokens: user.fcmTokens,
  };

  const messages = await messaging.sendEachForMulticast(message);

  logger.debug(`Sent ${user.fcmTokens.length} push notification for task ${task.id}, successful: ${messages.successCount}, failed: ${messages.failureCount}`);
};

const getNotificationTitle = (reminderType) => {
  // Set the notification title based on the reminder type
  switch (reminderType) {
    case "half_way":
      return "Reminder!";
    case "five_hours_left":
      return "Running Out of Time!";
    case "thirty_minutes_left":
      return "Now or Never!";
    case "expired":
      return "Better Luck Next Time!";
    default:
      return "Reminder";
  }
};


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
