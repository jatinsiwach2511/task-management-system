import Joi from "joi";
import {
  PRIORITY_STATUS,
  TASK_STATUS,
  nullableEnumValidator,
  stringValidator,
} from "../../../utils";

export default Joi.object(
  ((messageKey) => ({
    title: stringValidator(messageKey, "title"),
    description: stringValidator(messageKey, "description"),
    priority: nullableEnumValidator(PRIORITY_STATUS, messageKey, "priority"),
    status: nullableEnumValidator(TASK_STATUS, messageKey, "status"),
  }))("createTask")
).options({ stripUnknown: true });
