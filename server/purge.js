/**
 * Email Urgency Purge Script
 * Scheduled job that runs daily at 3:00 AM to purge old messages
 */

const cron = require("node-cron");
const { DateTime } = require("luxon");

// Configure purge age (in days)
const PURGE_AGE_DAYS = 30;

/**
 * Function to simulate purging old messages
 */
function purgeOldMessages() {
  const now = DateTime.now();
  const purgeDate = now.minus({ days: PURGE_AGE_DAYS });

  console.log(
    `[${now.toFormat(
      "yyyy-MM-dd HH:mm:ss"
    )}] Would delete messages older than ${purgeDate.toFormat("yyyy-MM-dd")}`
  );

  // In actual implementation:
  // 1. Connect to database
  // 2. Find messages older than purgeDate
  // 3. Delete or archive them
  // 4. Log results
}

// Schedule job to run daily at 03:00
console.log("Email purge scheduler started...");
console.log(
  `Messages older than ${PURGE_AGE_DAYS} days will be purged daily at 03:00`
);

cron.schedule("0 3 * * *", () => {
  console.log("Running scheduled purge job...");
  purgeOldMessages();
});

// Run once on startup for testing
purgeOldMessages();
