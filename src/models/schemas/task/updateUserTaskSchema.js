import Joi from 'joi';
import { requiredEnumValidator, TASK_STATUS } from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    status: requiredEnumValidator(TASK_STATUS, messageKey, 'status'),
  }))('createTask')
).options({ stripUnknown: true });
