import Joi from 'joi';
import { requiredUtcTimeDateValidator } from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    dueDate: requiredUtcTimeDateValidator(messageKey, 'dueDate'),
  }))('updateTaskDueDate')
).options({ stripUnknown: true });
