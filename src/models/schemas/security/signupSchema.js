import Joi from 'joi';
import {
  requiredStringValidator,
  requiredEmailValidator,
  requiredTimeZoneValidator,
} from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    firstName: requiredStringValidator(messageKey, 'firstName'),
    lastName: requiredStringValidator(messageKey, 'lastName'),
    email: requiredEmailValidator(messageKey, 'email'),
    password: requiredStringValidator(messageKey, 'password'),
    timeZone: requiredTimeZoneValidator(messageKey, 'timeZone'),
  }))('signup')
).options({ stripUnknown: true });
