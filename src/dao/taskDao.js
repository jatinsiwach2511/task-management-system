import { Queries } from "./helper";
import { Mapper } from "./helper";
import { taskUpdateMap } from "../models";

class taskDao {
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
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ Error: Task creation failed! ${err}`);
    }
  }
  async updateTask(client, updateTaskDto) {
    try {
      const { sql: sql, args: args } = await Queries.updaterFor(
        "tasks",
        taskUpdateMap,
        updateTaskDto
      );
      const res1 = await client.query(sql, args);
      return res1.rowCount === 1;
    } catch (err) {
      console.error(`❌ Error: Task updation failed! ${err}`);
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
    }
  }
}

export default taskDao;
