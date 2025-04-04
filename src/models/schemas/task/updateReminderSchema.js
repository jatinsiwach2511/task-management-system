import Joi from 'joi';
import {
  REMINDER_TYPE,
  requiredEnumValidator,
  stringValidator,
  utcTimeDateValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    type: requiredEnumValidator(REMINDER_TYPE, messageKey, 'type'),
    remindAt: utcTimeDateValidator(messageKey, 'remindAt'),
    message: stringValidator(messageKey, 'message'),
  }))('updateReminder')
).options({ stripUnknown: true });
