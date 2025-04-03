import Joi from 'joi';
import {
  PRIORITY_STATUS,
  requiredEnumValidator,
  requiredStringValidator,
  requiredUtcTimeDateValidator,
  stringValidator,
  utcTimeDateValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    title: requiredStringValidator(messageKey, 'title'),
    description: stringValidator(messageKey, 'description'),
    dueDate: requiredUtcTimeDateValidator(messageKey, 'dueDate'),
    priority: requiredEnumValidator(PRIORITY_STATUS, messageKey, 'priority'),
    remindAt: utcTimeDateValidator(messageKey, 'remindAt'),
    reminderNote: stringValidator(messageKey, 'reminderNote'),
  }))('createTask')
).options({ stripUnknown: true });
