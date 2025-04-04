import { object } from "joi";
import { QueryBuilder } from "./helper";
import { Queries } from "./helper";

class userTasksDao {
  userTaskQuery = `SELECT * FROM usertasks ut INNER JOIN tasks t ON ut.taskid = t.id`;

  async findTaskById(client, taskid, userId) {
    try {
      const { sql, args } = new QueryBuilder(
        `${this.userTaskQuery} WHERE t.id=? AND ut.userid=?`,
        [taskid, userId]
      ).build();

      const res = await client.query(sql, args);
      return res.rows[0];
    } catch (err) {
      console.error(`❌ Error: Task fetching failed! for the user ${err}`);
      throw new Error(`Error: Task fetching failed! for the user ${err}`);
    }
  }
  async getAllTasks(client, filters, userId) {
    try {
      const qb = new QueryBuilder(`${this.userTaskQuery} WHERE ut.userid=?`, [
        userId,
      ]);
      "status", "priority", "title", "due_in";

      if (filters?.filters?.status) {
        qb.append(` AND t.status=?`, [filters?.filters?.status]);
      }
      if (filters?.filters?.priority) {
        qb.append(` AND t.priority=?`, [filters?.filters?.priority]);
      }
      if (filters?.filters?.title) {
        qb.append(` AND t.title LIKE ?`, [`%${filters.filters.title}%`]);
      }
      if (filters?.filters?.due_in) {
        qb.append(
          ` AND t.due_on BETWEEN NOW() AND NOW() + (? * INTERVAL '1 HOUR')`,
          [Number(filters.filters.due_in)]
        );
      }
      if (filters?.limit) {
        qb.append(` LIMIT ?`, [filters?.limit]);
      }
      if (filters?.offset) {
        qb.append(` OFFSET ?`, [filters?.offset]);
      }
      const { sql, args } = qb.build();

      const res = await client.query(sql, args);
      return res.rows;
    } catch (err) {
      console.error(`❌ Error: Task fetching failed! for the user ${err}`);
      throw new Error(`Error: Task fetching failed! for the user ${err}`);
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
      throw new Error(`Error: Task fetching failed! for the user ${err}`);
    }
  }
}

export default userTasksDao;
