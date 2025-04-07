// reminderScheduler.js
import Container from "typedi";
import cron from "node-cron";
import ReminderDao from "../dao/reminderDao";

class ReminderScheduler {
  constructor() {
    this.txs = Container.get("DbTransactions");
    this.reminderDao = new ReminderDao();
    this.cronJob = null;
  }

  async start() {
    try {
      await this.setupCronJob();
      this.setupShutdownHandlers();
      console.log("✌️ Reminder scheduler started");
      return this;
    } catch (err) {
      console.error("❌ Failed to start reminder scheduler:", err);
      throw err;
    }
  }

  async setupCronJob() {
    this.cronJob = cron.schedule("* * * * *", async () => {
      console.log("⏰ Running reminder check...");
      try {
        await this.txs.withTransaction(async (client) => {
          const result = await this.reminderDao.processDueReminders(client);
          console.log(`✉️ Processed ${result.processed} reminders`);
        });
      } catch (err) {
        console.error("⚠️ Cron job iteration failed:", err);
      }
    });
  }

  async stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log("🛑 Cron job stopped");
    }
  }

  setupShutdownHandlers() {
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }
}

export default ReminderScheduler;
