import { QueryBuilder } from "./helper";

class ReminderDao {
  reminderJoin = `
      LEFT JOIN usertasks ut ON r.usertaskid = ut.id 
      LEFT JOIN users u ON ut.userid = u.id`;

  reminderQuery = `
      SELECT 
        u.id,
        u.email,
        r.reminder_time,
        r.message,
        r.status 
      FROM reminders r
      ${this.reminderJoin} 
    `;

  async getDueReminders(client) {
    try {
      const { sql, args } = new QueryBuilder(
        `${this.reminderQuery} WHERE r.reminder_time <= NOW()
      AND r.status = ?`,
        ["PENDING"].build()
      );
      const res = client.query(sql, args);
    } catch (error) {
      throw new Error(`Failed to fetch due reminders: ${error.message}`);
    }
  }
}

export default ReminderDao;
