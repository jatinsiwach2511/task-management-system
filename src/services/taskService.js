import Container from 'typedi';
import {
  convertIsoToLocalDateTime,
  formatSuccessResponse,
  HttpException,
} from '../utils';
import { TaskDao } from '../dao';
import UserService from './userService';

const permissionLevel = Object.freeze({
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  OWNER: 'OWNER',
});

export default class TaskService {
  constructor() {
    this.txs = Container.get('DbTransactions');
    this.dao = Container.get(TaskDao);
    this.userService = Container.get(UserService);
  }

  async createTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'createTask';
      if (await this.dao.findDuplicateTask(client, dto, actionUser)) {
        throw new HttpException.Conflict(
          formatErrorResponse(messageKey, 'duplicateTask')
        );
      }
      try {
        const createTaskDto = TaskService.makeCreateTaskDto(dto, actionUser);
        await this.dao.createTask(client, createTaskDto);
        return formatSuccessResponse(messageKey, 'createdSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToCreate')
        );
      }
    });
  }

  // Filterd data
  async getAllTasks() {}

  async getTaskById(id, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'getTaskById';
      const task = await this.dao.findTaskById(client, id);
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }
      const timeZone = await this.userService.dao.getTimeZone(
        client,
        actionUser.id
      );
      return TaskService.makeTaskResponse(task, timeZone);
    });
  }

  async updateTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'updateTask';
      const task = await this.dao.findTaskById(client, dto.id, actionUser.id);

      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      if (
        !(
          TaskService.hasTaskPermission(
            permissionLevel.EDIT,
            task.permission
          ) ||
          TaskService.hasTaskPermission(permissionLevel.OWNER, task.permission)
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, 'permissionDenied')
        );

      try {
        const updateTaskDto = TaskService.makeUpdateTaskDto(dto, actionUser);
        await this.dao.updateTask(client, updateTaskDto);
        return formatSuccessResponse(messageKey, 'updatedSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToUpdate')
        );
      }
    });
  }

  async updateTaskDueDate(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'updateTaskDueDate';
      const task = await this.dao.findTaskById(client, dto.id, actionUser.id);

      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      if (
        !(
          TaskService.hasTaskPermission(
            permissionLevel.EDIT,
            task.permission
          ) ||
          TaskService.hasTaskPermission(permissionLevel.OWNER, task.permission)
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, 'permissionDenied')
        );

      try {
        const updateTaskDueDateDto = TaskService.makeUpdateTaskDueDateDto(
          dto,
          actionUser
        );
        await this.dao.updateTask(client, updateTaskDueDateDto);

        // if(updatedDueDate<1hr) delete all reminders of all users
        // if(reminders not existed before) create to all users
        // if(exists) update all and set default
        const reminders = await this.dao.getAllRemindersByTaskId(dto.id);
        if (isWithinTimeRange(dto.dueDate)) {
          await this.dao.deleteRemindersInBatch(dto.id);
        } else if (!reminders || reminders.length === 0) {
          await this.dao.createRemindersInBatch(dto);
        } else {
          await this.dao.updateRemindersInBatch(dto);
        }

        return formatSuccessResponse(messageKey, 'updatedSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToUpdate')
        );
      }
    });
  }

  async deleteTask(id, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'deleteTask';
      const task = await this.dao.findTaskById(client, id, actionUser.id);

      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      if (
        !(
          TaskService.hasTaskPermission(
            permissionLevel.DELETE,
            task.permission
          ) ||
          TaskService.hasTaskPermission(permissionLevel.OWNER, task.permission)
        )
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, 'permissionDenied')
        );

      try {
        await this.dao.deleteTask(client, id);
        return formatSuccessResponse(messageKey, 'deletedSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToDelte')
        );
      }
    });
  }

  async getTasksStatus(userId) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'getTasksStatus';
      // depend on task getTasks
      const userTasks = await this.dao.getTasks({ userId: userId });
      if (!userTasks)
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      const timeZone = await this.userService.dao.getTimeZone(
        client,
        actionUser.id
      );
      return TaskService.makeTasksStatusResponse(userTasks, timeZone);
    });
  }

  // Incomplete
  async shareTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'shareTask';
      const task = await this.dao.findTaskById(client, id, actionUser.id);

      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      if (await this.dao.findDuplicate(client, dto, actionUser)) {
        throw new HttpException.Conflict(
          formatErrorResponse(messageKey, 'duplicateTask')
        );
      }
      try {
        const createTaskDto = TaskService.makeCreateTaskDto(dto, actionUser);
        await this.dao.createTask(client, createTaskDto);
        return formatSuccessResponse(messageKey, 'createdSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToCreate')
        );
      }
    });
  }

  async updateShareTaskPermission(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'updateShareTaskPermission';
      const task = await this.dao.findTaskById(client, dto.id, actionUser.id);
      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      if (
        !TaskService.hasTaskPermission(permissionLevel.OWNER, task.permission)
      )
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, 'permissionDenied')
        );

      try {
        const updateShareTaskPermissionDto =
          TaskService.makeShareTaskPermissionDto(dto, actionUser);
        await this.dao.updateShareTaskPermission(
          client,
          updateShareTaskPermissionDto
        );
        return formatSuccessResponse(messageKey, 'updatedSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToUpdate')
        );
      }
    });
  }

  async updateReminder(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'updateReminder';
      const reminder = await this.dao.findReminderById(
        client,
        dto.id,
        actionUser.id
      );

      if (!reminder) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      try {
        const updateReminderDto = TaskService.makeUpdateReminderDto(
          dto,
          actionUser
        );
        await this.dao.updateTask(client, updateReminderDto);
        return formatSuccessResponse(messageKey, 'updatedSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToUpdate')
        );
      }
    });
  }

  async updateUserTask(dto, actionUser) {
    return this.txs.withTransaction(async (client) => {
      const messageKey = 'updateUserTask';
      const task = await this.dao.findTaskById(client, dto.id, actionUser.id);

      if (!task) {
        throw new HttpException.NotFound(
          formatErrorResponse(messageKey, 'notFound')
        );
      }

      try {
        const updateUserTaskDto = TaskService.makeUpdateUserTaskDto(
          dto,
          actionUser
        );
        await this.dao.updateTask(client, updateUserTaskDto);
        return formatSuccessResponse(messageKey, 'updatedSuccessfully');
      } catch (err) {
        throw new HttpException.ServerError(
          formatErrorResponse(messageKey, 'unableToUpdate')
        );
      }
    });
  }

  static hasTaskPermission(permissionLevel, userPermission) {
    return permissionLevel === userPermission;
  }

  static makeCreateTaskDto(dto, actionUser) {
    // check for reminder creation
    return {
      ...dto,
      createdBy: actionUser.id,
      updatedBy: actionUser.id,
      reminder,
    };
  }

  static makeUpdateTaskDto(dto, actionUser) {
    return {
      ...dto,
      updatedBy: actionUser.id,
    };
  }

  static makeTasksStatusResponse(tasks, timeZone) {
    return tasks.map((task) => ({
      id: task.id,
      status: task.status,
      dueDate: convertIsoToLocalDateTime(task.dueDate, timeZone),
    }));
  }

  static makeTaskResponse(task, timeZone) {
    const dueDate = convertIsoToLocalDateTime(task.dueDate, timeZone);
    const remindAt = convertIsoToLocalDateTime(task.remindAt, timeZone) || null;
    return {
      id: 1,
      title: 'Do some task',
      description: 'abc',
      // Formated based on user zone
      dueDate: '2025-03-27 18:00:00',
      timeZone,
      priority: 'HIGH',
      status: 'PENDING',
      createdBy: 'Virat',
      // Reminder = custom | default | null (if due date in less than 1hr)
      reminder: 'default',
      // Nullable | formated to user zone preference
      remindAt,
      reminderMessage: 'abc',
      // Permission = VIEW | EDIT | DELETE
      permissions: 'VIEW',
    };
  }

  static makeShareTaskPermissionDto(dto, actionUser) {
    return {
      taskId: dto.id,
      userId: dto.userId,
      permission: dto.permission,
      updatedBy: actionUser.id,
    };
  }

  static makeUpdateReminderDto(dto, actionUser) {
    return {
      id: dto.id,
      remindAt: dto?.remindAt,
      message: dto?.message,
      updatedBy: actionUser.id,
    };
  }

  static makeUpdateUserTaskDto(dto, actionUser) {
    return {
      id: dto.id,
      status: dto.status,
      updatedBy: actionUser.id,
    };
  }
}
