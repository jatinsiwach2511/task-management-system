import { Queries, Mapper, QueryBuilder } from "./helper";
import { taskUpdateMap } from "../models";

class taskDao {
  reminderUserTaskQuery = `SELECT r.id FROM reminders r LEFT JOIN usertasks ut ON ut.id=r.usertaskid`;

  async createTask(client, createTaskDto) {
    try {
      await client.query("BEGIN");
      const { sql: sql1, args: args1 } = Queries.creatorFor(
        "tasks",
        createTaskDto.task
      );
      const res1 = await client.query(sql1, args1);
      const taskid = Mapper.getId(res1);
      const usertaskobj = {
        userid: createTaskDto.task.created_by,
        taskid: taskid,
        permission_level: "OWNER",
        assigned_by: createTaskDto.task.created_by,
      };
      const { sql: sql2, args: args2 } = Queries.creatorFor(
        "usertasks",
        usertaskobj
      );
      const res2 = await client.query(sql2, args2);
      const usertaskid = Mapper.getId(res2);
      if (createTaskDto.reminder.createReminder) {
        const { createReminder, ...reminderDto } = createTaskDto.reminder;
        const reminderobj = {
          ...reminderDto,
          usertaskid: usertaskid,
        };
        const { sql: sql3, args: args3 } = Queries.creatorFor(
          "reminders",
          reminderobj
        );
        const res3 = await client.query(sql3, args3);
      }
      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ Error: Task creation failed! ${err}`);
      throw new Error(`Task creation failed! ${err}`);
    }
  }
  async updateTask(client, updateTaskDto) {
    try {
      const { sql: sql, args: args } = Queries.updaterFor(
        "tasks",
        taskUpdateMap,
        updateTaskDto
      );
      const res1 = await client.query(sql, args);
      return res1.rowCount === 1;
    } catch (err) {
      console.error(`❌ Error: Task updation failed! ${err}`);
      throw new Error(`Error: Task updation failed! ${err}`);
    }
  }
  async deleteTask(client, taskId) {
    try {
      const res = await client.query("DELETE FROM tasks WHERE id = $1", [
        taskId,
      ]);
      return res.rowCount === 1;
    } catch (err) {
      console.error(`❌ Error: Task deletion failed! ${err}`);
      throw new Error(`Error: Task deletion failed! ${err}`);
    }
  }
  async getAllRemindersByTaskId(client, taskId) {
    try {
      const qb = new QueryBuilder(
        `${this.reminderUserTaskQuery} WHERE ut.taskid = ?`,
        [taskId]
      );
      const { sql, args } = qb.build();
      const res = await client.query(sql, args);
      return res.rows;
    } catch (err) {
      console.error(`❌ Error: Reminder fetching failed  ${err}`);
      throw new Error(`Error:  Reminder fetching failed  ${err}`);
    }
  }
  async deleteRemindersInBatch(client, reminders) {
    console.log("====reminders", reminders);
    try {
      const res = await client.query(`DELETE FROM Reminders WHERE id IN ($1)`, [
        reminders,
      ]);
    } catch (err) {
      console.error(`❌ Error: Reminder deletion failed  ${err}`);
      throw new Error(`Error:  Reminder deletion failed  ${err}`);
    }
  }
}

export default taskDao;
