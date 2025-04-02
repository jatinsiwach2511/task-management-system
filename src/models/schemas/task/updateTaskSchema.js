import Joi from 'joi';
import {
  PRIORITY_STATUS,
  TASK_STATUS,
  stringValidator,
  utcTimeDateValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    title: stringValidator(messageKey, 'title'),
    description: stringValidator(messageKey, 'description'),
    dueDate: utcTimeDateValidator(messageKey, 'dueDate'),
    priority: nullableEnumValidator(PRIORITY_STATUS, messageKey, 'priority'),
    status: nullableEnumValidator(TASK_STATUS, messageKey, 'status'),
  }))('createTask')
).options({ stripUnknown: true });
