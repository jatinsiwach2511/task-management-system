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
    title: requiredStringValidator(messageKey, 'title'),
    description: stringValidator(messageKey, 'description'),
    dueDate: requiredUtcTimeDateValidator(messageKey, 'dueDate'),
    priority: requiredEnumValidator(PRIORITY_STATUS, messageKey, 'priority'),
    reminderType: requiredEnumValidator(
      REMINDER_TYPE,
      messageKey,
      'reminderType'
    ),
    remindAt: utcTimeDateValidator(messageKey, 'remindAt'),
    reminderMessage: stringValidator(messageKey, 'reminderMessage'),
  }))('createTask')
).options({ stripUnknown: true });
