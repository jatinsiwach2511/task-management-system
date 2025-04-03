import { QueryBuilder } from "./helper";
import EmailService from "../services";

class ReminderDao {
  reminderJoin = `
      LEFT JOIN usertasks ut ON r.usertaskid = ut.id 
      LEFT JOIN users u ON ut.userid = u.id`;

  reminderQuery = `
      SELECT 
        u.id,
        u.email,
        r.id AS "rId",
        r.reminder_time,
        r.message,
        r.status 
      FROM reminders r
      ${this.reminderJoin}`;

  async processDueReminders(client) {
    try {
      await client.query("BEGIN");
      const { sql, args } = new QueryBuilder(
        `${this.reminderQuery} WHERE r.reminder_time <= NOW()
      AND r.status = ? FOR UPDATE OF r SKIP LOCKED 
        LIMIT 100`,
        ["PENDING"]
      ).build();
      const res = client.query(sql, args);
      for (const reminder of res.rows) {
        try {
          await EmailService.sendMail({
            to: reminder.email,
            subject: "Reminder notification",
            text: reminder.message,
          });

          await client.query(
            `UPDATE reminders 
             SET status = 'SENT', sent_at = NOW() 
             WHERE id = $1`,
            [reminder.rId]
          );
        } catch (emailerr) {
          await client.query(
            `UPDATE reminders 
             SET status = 'FAILED', error = $1 
             WHERE id = $2`,
            [emailerr.message, reminder.rId]
          );
        }
      }

      await client.query("COMMIT");
      return { processed: res.rows.length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Failed to process reminders: ${error.message}`);
    }
  }
}

export default ReminderDao;
