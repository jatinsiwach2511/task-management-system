import Joi from "joi";
import {
  nullableRegexValidator,
  nullableEmailValidator,
  requiredEnumArrayValidator,
  MFA_METHODS,
} from "../../../utils";

export default Joi.object(
  ((messageKey) => ({
    selectedMethods: requiredEnumArrayValidator(
      MFA_METHODS,
      messageKey,
      "methodsType"
    ),
    phone: nullableRegexValidator(
      /^\+?[1-9]\d{1,14}$/,
      messageKey,
      "phoneNumberFormat"
    ),
    email: nullableEmailValidator(messageKey, "emailFormat"),
  }))("registerMfa")
).options({ stripUnknown: true });
