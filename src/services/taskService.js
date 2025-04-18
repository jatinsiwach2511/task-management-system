import Container from "typedi";
import {
  convertIsoToLocalDateTime,
  formatErrorResponse,
  formatSuccessResponse,
  getDefautReminderTime,
  HttpException,
  isDueInLessThanTimeRange,
  isOverdue,
  isReminderWithinDueTime,
  messageResponse,
} from "../utils";
import { TaskDao } from "../dao";
import { UserTasksDao } from "../dao";
import UserService from "./userService";

const permissionLevel = Object.freeze({
  EDIT: "EDIT",
  DELETE: "DELETE",
  VIEW: "VIEW",
  OWNER: "OWNER",
});

export default class TaskService {
  constructor() {
    this.txs = Container.get("DbTransactions");
    this.dao = Container.get(TaskDao);
    this.UserTasksDao = Container.get(UserTasksDao);
    this.userService = Container.get(UserService);
  }

  async createTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "createTask";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToCreate")
      );
      if (
        dto?.reminderType === "CUSTOM" &&
        dto?.remindAt &&
        !isReminderWithinDueTime(dto.remindAt, dto.dueDate)
      ) {
        throw new HttpException.BadRequest(
          formatErrorResponse(messageKey, "reminderTimeExceeds")
        );
      }
      try {
        const createTaskDto = TaskService.makeCreateTaskDto(dto, actionUser);
        const success = await this.dao.createTask(client, createTaskDto);
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "createdSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  async getAllTasks(filters, userId) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "getAllTasks";
      const userTasks = await this.UserTasksDao.getAllTasks(
        client,
        filters,
        userId
      );
      if (!userTasks)
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      const timeZone = await this.userService.dao.getTimeZone(client, userId);
      return TaskService.makeGetAllTasksResponse(
        userTasks,
        timeZone,
        TaskService.makeTaskResponse
      );
    });
  }

  async getTaskById(id, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "getTaskById";
      const task = await this.UserTasksDao.findTaskById(
        client,
        id,
        actionUser.id
      );
      console.log(id, actionUser);
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }

      console.log("======1");
      const timeZone = await this.userService.dao.getTimeZone(
        client,
        actionUser.id
      );
      return TaskService.makeTaskResponse(task, timeZone);
    });
  }

  async updateTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "updateTask";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToUpdate")
      );
      const task = await this.UserTasksDao.findTaskById(
        client,
        dto.id,
        actionUser.id
      );
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }
      if (
        !(
          TaskService.hasTaskPermission(
            permissionLevel.EDIT,
            task.permission_level
          ) ||
          TaskService.hasTaskPermission(
            permissionLevel.OWNER,
            task.permission_level
          )
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, "permissionDenied")
        );
      try {
        const updateTaskDto = TaskService.makeUpdateTaskDto(dto, actionUser);
        const success = await this.dao.updateTask(client, updateTaskDto);
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "updatedSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  async updateTaskDueDate(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "updateTaskDueDate";
      const task = await this.UserTasksDao.findTaskById(
        client,
        dto.id,
        actionUser.id
      );
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }
      if (
        !(
          TaskService.hasTaskPermission(
            permissionLevel.EDIT,
            task.permission_level
          ) ||
          TaskService.hasTaskPermission(
            permissionLevel.OWNER,
            task.permission_level
          )
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, "permissionDenied")
        );
      try {
        const updateTaskDueDateDto = TaskService.makeUpdateTaskDueDateDto(
          dto,
          actionUser
        );
        await this.dao.updateTask(client, updateTaskDueDateDto);

        return messageResponse(
          formatSuccessResponse(messageKey, "updatedSuccessfully")
        );
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, "unableToUpdate")
        );
      }
    });
  }

  async deleteTask(id, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "deleteTask";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToDelte")
      );
      const task = await this.UserTasksDao.findTaskById(
        client,
        id,
        actionUser.id
      );
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }
      if (
        !(
          TaskService.hasTaskPermission(
            permissionLevel.DELETE,
            task.permission_level
          ) ||
          TaskService.hasTaskPermission(
            permissionLevel.OWNER,
            task.permission_level
          )
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, "permissionDenied")
        );
      try {
        const success = await this.dao.deleteTask(client, id);
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "deletedSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  async getTasksStatus(filters, userId) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "getTasksStatus";
      const userTasks = await this.UserTasksDao.getAllTasks(
        client,
        filters,
        userId
      );
      if (!userTasks)
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      console.log(userTasks);
      const timeZone = await this.userService.dao.getTimeZone(client, userId);
      return TaskService.makeTasksStatusResponse(userTasks, timeZone);
    });
  }

  // Incomplete
  async shareTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "shareTask";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToShare")
      );
      const task = await this.dao.findTaskById(client, id, actionUser.id);

      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }

      if (
        !TaskService.hasTaskPermission(
          permissionLevel.OWNER,
          task.permission_level
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, "permissionDenied")
        );

      if (await this.dao.findDuplicate(client, dto, actionUser)) {
        throw new HttpException.Conflict(
          formatErrorResponse(messageKey, "duplicateTask")
        );
      }

      try {
        const shareTaskDto = TaskService.makeShareTaskDto(dto, actionUser);
        const success = await this.dao.shareTask(client, shareTaskDto);
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "sharedSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  async updateShareTaskPermission(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "updateShareTaskPermission";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToUpdate")
      );
      const task = await this.dao.findTaskById(client, dto.id, actionUser.id);
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }

      if (
        !TaskService.hasTaskPermission(
          permissionLevel.OWNER,
          task.permission_level
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, "permissionDenied")
        );
      try {
        const updateShareTaskPermissionDto =
          TaskService.makeShareTaskPermissionDto(dto, actionUser);
        const success = await this.dao.updateShareTaskPermission(
          client,
          updateShareTaskPermissionDto
        );
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "updatedSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  async updateReminder(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "updateReminder";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToUpdate")
      );
      const reminder = await this.dao.findReminderById(
        client,
        dto.id,
        actionUser.id
      );

      if (!reminder) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }
      const dueDate = getDueDateByReminderId(dto.id);
      if (!isReminderWithinDueTime(dto.remindAt, dueDate))
        throw new HttpException.BadRequest(
          formatErrorResponse(messageKey, "reminderTimeExceeds")
        );

      try {
        const updateReminderDto = TaskService.makeUpdateReminderDto(
          { ...dto, dueDate },
          actionUser
        );
        const success = await this.dao.updateReminder(
          client,
          updateReminderDto
        );
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "updatedSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  async updateUserTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = "updateUserTask";
      const serverError = new HttpException.ServerError(
        formatErrorResponse(messageKey, "unableToUpdate")
      );
      const task = await this.dao.findTaskById(client, dto.id, actionUser.id);
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, "notFound")
        );
      }

      try {
        const updateUserTaskDto = TaskService.makeUpdateUserTaskDto(
          dto,
          actionUser
        );
        const success = await this.dao.updateUserTask(
          client,
          updateUserTaskDto,
          actionUser.id
        );
        if (!success) throw serverError;
        return messageResponse(
          formatSuccessResponse(messageKey, "updatedSuccessfully")
        );
      } catch (err) {
        throw serverError;
      }
    });
  }

  static hasTaskPermission(permissionLevel, userPermission) {
    return permissionLevel === userPermission;
  }

  static makeCreateTaskDto(dto, actionUser) {
    const isDueSoon = isDueInLessThanTimeRange(dto.dueDate);
    return {
      task: {
        title: dto.title,
        description: dto?.description,
        due_on: dto.dueDate,
        priority: dto.priority,
        created_by: actionUser.id,
        updated_by: actionUser.id,
      },
      reminder: {
        createReminder: !isDueSoon,
        type: !isDueSoon ? dto.reminderType : undefined,
        reminder_time: !isDueSoon
          ? dto.reminderType === "CUSTOM"
            ? dto?.remindAt
            : getDefautReminderTime(dto.dueDate)
          : undefined,
        message: !isDueSoon
          ? dto.reminderType === "CUSTOM"
            ? dto?.reminderMessage
            : "Your task is pending"
          : undefined,
      },
    };
  }

  static makeUpdateTaskDto(dto, actionUser) {
    return {
      title: dto.title,
      description: dto?.description,
      priority: dto.priority,
      status: dto.status,
      updated_by: actionUser.id,
      id: dto.id,
    };
  }

  static makeTasksStatusResponse(tasks, timeZone) {
    return tasks.map((task) => ({
      id: task.id,
      status: task.status,
      dueDate: convertIsoToLocalDateTime(task.due_on, timeZone),
      overdue: isOverdue(task.due_on),
    }));
  }

  static makeTaskResponse(task, timeZone) {
    return {
      id: task.id,
      title: task.title,
      description: task?.description,
      dueDate: convertIsoToLocalDateTime(task.due_on, timeZone),
      priority: task.priority,
      status: task.status,
      // usertaskStatus: task.userTaskStatus,
      permissionLevel: task.permission_level,
      // // Should be a name
      // createdBy: tas k.created_by,
      // reminder: task?.reminder,
      // reminderType: task?.reminderType,
      // remindAt: convertIsoToLocalDateTime(task.remindAt, timeZone) || null,
      // reminderMessage: task.reminderMessage,
    };
  }

  static makeGetAllTasksResponse(tasks, timeZone, makeTaskResponse) {
    return tasks.map((task) => makeTaskResponse(task, timeZone));
  }

  static makeShareTaskPermissionDto(dto, actionUser) {
    return {
      taskId: dto.id,
      userId: dto.userId,
      permission_level: dto.permissionLevel,
      updated_by: actionUser.id,
    };
  }

  static makeUpdateReminderDto(dto, actionUser) {
    return {
      id: dto.id,
      type: dto.type,
      remindAt: dto.type === "CUSTOM" ? dto?.remindAt : getDefautReminderTime(),
      message:
        dto.type === "CUSTOM" ? dto?.reminderMessage : "Your task is pending",
      updated_by: actionUser.id,
    };
  }

  static makeUpdateUserTaskDto(dto, actionUser) {
    return {
      id: dto.id,
      status: dto.status,
      updated_by: actionUser.id,
    };
  }

  static makeGetAllTaskDto(dto, actionUser) {
    return {
      userId: actionUser.id,
      status: dto?.status,
      priority: dto?.priority,
      title: dto?.title,
      limit: dto?.limit,
      offset: dto?.offset,
      due_in: dto?.due_in,
    };
  }

  static makeUpdateTaskDueDateDto(dto, actionUser) {
    return {
      id: dto.id,
      due_on: dto.dueDate,
      updated_by: actionUser.id,
    };
  }

  static makeShareTaskDto(dto, actionUser) {}
}
