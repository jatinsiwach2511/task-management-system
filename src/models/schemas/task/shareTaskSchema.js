import Joi from 'joi';
import {
  requiredEmailValidator,
  requiredPermissionsValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    email: requiredEmailValidator(messageKey, 'email'),
    permissions: requiredPermissionsValidator(messageKey, 'permissions'),
  }))('shareTask')
).options({ stripUnknown: true });
