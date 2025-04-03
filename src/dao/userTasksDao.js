import { QueryBuilder } from "./helper";
import { Queries } from "./helper";

class userTasksDao {
  userTaskQuery = `SELECT * FROM usertasks ut INNER JOIN tasks t ON ut.taskid = t.id`;

  async getUserTask(client, userTaskDto) {
    try {
      const { sql, args } = new QueryBuilder(
        `${this.userTaskQuery} WHERE t.id=? && ut.userid=?`,
        [userTaskDto.taskId, userTaskDto.userId]
      ).build();
      const res = await client.query(sql, args);
      return res.rows;
    } catch (err) {
      console.error(`❌ Error: Task fetching failed! for the user ${err}`);
    }
  }
  async getAllTasks(client, userId) {
    try {
      const { sql, args } = new QueryBuilder(
        `${this.userTaskQuery} ut.userid=?`,
        [userId]
      ).build();
      const res = await client.query(sql, args);
      return res.rows;
    } catch (err) {
      console.error(`❌ Error: Task fetching failed! for the user ${err}`);
    }
  }
  async shareTask(client, shareTaskDto) {
    try {
      client.query("BEGIN");
      for (users of shareTaskDto.usersToShare) {
        const usertaskobj = {
          ...user,
          taskid: shareTaskDto.taskid,
          assigned_by: shareTaskDto.assignerId,
        };
        const { sql, args } = Queries.creatorFor("usertasks", usertaskobj);
        const res1 = client.query(sql, args);
      }
      client.query("COMMIT");
    } catch (err) {
      client.query("ROLLBACK");
      console.error(`❌ Error: Task fetching failed! for the user ${err}`);
    }
  }
}

export default userTasksDao;
