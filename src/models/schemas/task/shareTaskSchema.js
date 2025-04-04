import Joi from 'joi';
import {
  PERMISSION_LEVEL,
  requiredEnumValidator,
  requiredIdValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    userId: requiredIdValidator(messageKey, 'userId'),
    permissionLevel: requiredEnumValidator(
      PERMISSION_LEVEL,
      messageKey,
      'permissionLevel'
    ),
  }))('shareTask')
).options({ stripUnknown: true });
