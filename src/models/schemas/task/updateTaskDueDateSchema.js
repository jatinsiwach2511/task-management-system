import Joi from 'joi';
import {
  PRIORITY_STATUS,
  REMINDER_TYPE,
  requiredEnumValidator,
  requiredStringValidator,
  requiredUtcTimeDateValidator,
  stringValidator,
  utcTimeDateValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    dueDate: requiredUtcTimeDateValidator(messageKey, 'dueDate'),
  }))('updateTaskDueDate')
).options({ stripUnknown: true });
