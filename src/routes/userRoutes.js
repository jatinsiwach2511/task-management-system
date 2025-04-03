import { Container } from "typedi";
import {
  routes,
  featureLevel,
  get,
  put,
  patch,
  deleteMethod,
  post,
} from "./utils";
import { Right } from "../auth";
import { TaskService, UserService } from "../services";
import {
  createTaskSchema,
  shareTaskSchema,
  updateTaskSchema,
  updateUserProfileSchema,
} from "../models";

export default () => {
  // Profile related
  get(
    featureLevel.production,
    Right.user.FETCH_USER_PROFILE,
    routes.user.PROFILE,
    async (req) => {
      const service = Container.get(UserService);
      return await service.fetchUserProfile({ ...req.currentUser });
    }
  );

  put(
    featureLevel.production,
    Right.user.MODIFY_USER_PROFILE,
    routes.user.PROFILE,
    async (req) => {
      const service = Container.get(UserService);
      const updateDto = await updateUserProfileSchema.validateAsync(req.body);
      return await service.modifyUserProfile(updateDto, { ...req.currentUser });
    }
  );

  // Task related
  post(
    featureLevel.production,
    Right.user.CREATE_TASK,
    routes.task.CREATE_TASK,
    async (req) => {
      const service = Container.get(TaskService);
      const dto = await createTaskSchema.validateAsync(req.body);
      return await service.createTask(dto, { ...req.currentUser });
    }
  );

  // With filter
  get(
    featureLevel.production,
    Right.user.GET_TASKS,
    routes.task.GET_TASKS,
    async (req) => {
      const service = Container.get(TaskService);
      return await service.getTasks();
    }
  );

  get(
    featureLevel.production,
    Right.user.GET_TASK_BY_ID,
    routes.task.GET_TASK_BY_ID,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      return await service.getTaskById(id, { ...req.currentUser });
    }
  );

  patch(
    featureLevel.production,
    Right.user.UPDATE_TASK,
    routes.task.UPDATE_TASK,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      const dto = await updateTaskSchema.validateAsync(req.body);
      return await service.updateTask({ id, ...dto }, { ...req.currentUser });
    }
  );

  deleteMethod(
    featureLevel.production,
    Right.user.DELETE_TASK,
    routes.task.DELETE_TASK,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      return await service.deleteTask(id, { ...req.currentUser });
    }
  );

  get(
    featureLevel.production,
    Right.user.GET_TASKS_STATUS,
    routes.task.GET_TASKS_STATUS,
    async (req) => {
      const service = Container.get(TaskService);
      return await service.getTasksStatus(req.currentUser.id);
    }
  );

  post(
    featureLevel.production,
    Right.user.SHARE_TASK_BY_ID,
    routes.task.SHARE_TASK_BY_ID,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      const dto = await shareTaskSchema.validateAsync(req.body);
      return await service.shareTask({ id, ...dto }, { ...req.currentUser });
    }
  );

  patch(
    featureLevel.production,
    Right.user.UPDATE_SHARE_TASK_PERMISSION,
    routes.task.UPDATE_SHARE_TASK_PERMISSION,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      const dto = await shareTaskSchema.validateAsync(req.body);
      return await service.updateShareTaskPermission(
        { id, ...dto },
        { ...req.currentUser }
      );
    }
  );

  patch(
    featureLevel.production,
    Right.user.UPDATE_REMINDER,
    routes.task.UPDATE_REMINDER,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      const dto = await updateReminderSchema.validateAsync(req.body);
      return await service.updateReminder(
        { id, ...dto },
        { ...req.currentUser }
      );
    }
  );

  patch(
    featureLevel.production,
    Right.user.UPDATE_REMINDER,
    routes.task.UPDATE_REMINDER,
    async (req) => {
      const service = Container.get(TaskService);
      const { id } = req.params;
      const dto = await updateUserTaskSchema.validateAsync(req.body);
      return await service.updateUserTask(
        { id, ...dto },
        { ...req.currentUser }
      );
    }
  );
};
