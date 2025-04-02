import Joi from 'joi';
import { stringValidator, timeZoneValidator } from '../../../utils';

export default Joi.object(
  ((messageKey) => ({
    firstName: stringValidator(messageKey, 'firstName'),
    lastName: stringValidator(messageKey, 'lastName'),
    timeZone: timeZoneValidator(messageKey, 'timeZone'),
  }))('updateUserProfile')
).options({ stripUnknown: true });
