import cron from "node-cron";
import { sendDailyReport } from "./email/send-report.js";

console.log("-----------------------------------------");
console.log("🔊 CLEARPATH SENTINEL INITIALIZING...");
console.log("-----------------------------------------");
console.log("STAT: ACTIVE");
console.log("CRON TARGET: '0 7 * * *' (Every morning 7:00 AM)");
console.log("BOARD DISTRIBUTION SET AT:", (await import("./email/recipients.js")).BOARD_MEMBERS.join(", "));
console.log("-----------------------------------------");

// Run once instantly for logs visibility on server start
console.log("⚡ [PROACTIVE CHECK] Launching instant bootstrap report sequence...");
sendDailyReport()
  .then((res) => {
    console.log("✅ Ready state validated. Result:", JSON.stringify(res));
  })
  .catch((err) => {
    console.error("❌ Diagnostic dry-run failure:", err);
  });

cron.schedule("0 7 * * *", async () => {
  console.log("⏰ Running Scheduled Daily Sentinel Report...");
  try {
    await sendDailyReport();
    console.log("✅ Scheduled daily report sent successfully.");
  } catch (err) {
    console.error("❌ Scheduled Sentinel Error:", err);
  }
});
