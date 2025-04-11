import Joi from "joi";
import { requiredStringValidator } from "../../../utils";

export default Joi.object(
  ((messageKey) => ({
    otp: requiredStringValidator(messageKey, "otpVerification"),
  }))("verifyMfa")
).options({ stripUnknown: true });
