import { Container } from "typedi";
import { mfaDao } from "../dao";
import { Promise } from "bluebird";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import {
  HttpException,
  formatErrorResponse,
  formatSuccessResponse,
  messageResponse,
  VERIFICATION_PURPOSE,
} from "../utils";
import { EmailService, smsService } from "./index";
class mfaService {
  constructor() {
    this.txs = Container.get("DbTransactions");
    this.dao = Container.get(mfaDao);
    this.emailService = Container.get(EmailService);
    this.smsService = Container.get(smsService);
  }
  static generateSecret(identifier = "user") {
    const secret = speakeasy.generateSecret({
      name: `TaskManagement:${identifier}`,
      length: 20,
    });
    return secret;
  }

  static generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp;
  }

  static async validateTotp(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1,
    });
  }

  async sendEmailOtp(email, otp) {
    this.emailService.sendMail({
      to: email,
      subject: "MFA otp verification",
      text: `Your OTP for email verification is ${otp}`,
    });
  }
  async sendOtps(
    client,
    methods,
    actionUser,
    purpose = VERIFICATION_PURPOSE.MFASETUP
  ) {
    let totp = null;
    for (const method in methods) {
      switch (method) {
        case "email":
          const otp = mfaService.generateOtp();
          await this.dao.pushEmailOtp(
            client,
            { email: methods[method], otp: otp.toString() },
            actionUser.id,
            purpose
          );
          await this.sendEmailOtp(methods[method], otp);
          break;
        case "phone":
          const phoneOtp = mfaService.generateOtp();
          await this.dao.pushPhoneOtp(
            client,
            { phone: methods[method], otp: phoneOtp.toString() },
            actionUser.id,
            purpose
          );
          const otpMessage = `hii there i am you friend want to send this friendly messag ewith a sample otp ${phoneOtp}`;
          await this.smsService.sendSms(methods[method], otpMessage);
          break;

        case "totp":
          console.log("====1");
          const secret = mfaService.generateSecret(actionUser.firstName);
          console.log("====2");
          await this.dao.addTempMfaSecret(
            client,
            { secret: secret.base32 },
            actionUser.id,
            purpose
          );
          console.log("====3");
          const asyncUrlGenerateFunc = Promise.promisify(qrcode.toDataURL, {
            multiArgs: true,
            context: qrcode,
          });
          console.log("====4");
          const data = await asyncUrlGenerateFunc(secret.otpauth_url);
          totp = data;
          console.log("====5");
          break;
      }
      return totp;
    }
  }
  async setupMfa(actionUser, dto, client) {
    const options = dto?.selectedMethods || [];
    const messageKey = "setupMfa";
    const formattedMethods = {};
    for (const method of options) {
      if (method !== "totp") {
        if (!dto[method]) {
          throw new HttpException.BadRequest(
            formatErrorResponse(messageKey, "methodRequired")
          );
        }
        formattedMethods[method] = dto[method];
      } else {
        formattedMethods[method] = true;
      }
    }
    const totp = await this.sendOtps(
      client,
      formattedMethods,
      actionUser,
      VERIFICATION_PURPOSE.MFASETUP
    );
    if (totp) {
      return { qrCode: totp };
    }
    return messageResponse(formatSuccessResponse(messageKey, "sent"));
  }

  async verifyEmail(actionUser, dto, purpose) {
    const messageKey = "verifyEmail";
    return this.txs.withTransaction(async (client) => {
      const res = await this.dao.getEmailOtp(client, actionUser.id, purpose);
      if (dto.otp === res.verification_token) {
        await this.dao.verifyEmail(client, actionUser.id, purpose);
        return messageResponse(formatSuccessResponse(messageKey, "success"));
      }
      return messageResponse(formatSuccessResponse(messageKey, "failed"));
    });
  }

  async verifyPhone(actionUser, dto, purpose) {
    const messageKey = "verifyPhone";
    return this.txs.withTransaction(async (client) => {
      const res = await this.dao.getMobileOtp(client, actionUser.id, purpose);
      if (dto.otp === res.verification_token) {
        await this.dao.verifyPhone(client, actionUser.id, purpose);
        return messageResponse(formatSuccessResponse(messageKey, "success"));
      }
      return messageResponse(formatSuccessResponse(messageKey, "failed"));
    });
  }

  async verifyTotp(actionUser, dto, purpose) {
    const messageKey = "verifyTotp";
    return this.txs.withTransaction(async (client) => {
      const res = await this.dao.gettotpSecret(client, actionUser.id, purpose);
      const isvalidOtp = await mfaService.validateTotp(
        res.authenticator_secret,
        dto.otp
      );
      if (isvalidOtp) {
        await this.dao.verifyTotp(client, actionUser.id, purpose);
        return messageResponse(formatSuccessResponse(messageKey, "success"));
      }
      return messageResponse(formatSuccessResponse(messageKey, "failed"));
    });
  }
  async completeMfa(actionUser) {
    const messageKey = "completeMfa";
    return this.txs.withTransaction(async (client) => {
      const data = await this.dao.isMfaFullyVerified(
        client,
        actionUser.id,
        VERIFICATION_PURPOSE.MFASETUP
      );
      const { email_verified, phone_verified, totp_verified } = data;
      if (email_verified && phone_verified && totp_verified) {
        await this.dao.migrateEmailMfaRecord(client, actionUser.id);

        await this.dao.migratePhoneMfaRecord(client, actionUser.id);

        await this.dao.migrateTotpMfaRecord(client, actionUser.id);

        await this.dao.enableMfa(client, actionUser.id);

        return messageResponse(formatSuccessResponse(messageKey, "success"));
      }
      return messageResponse(formatSuccessResponse(messageKey, "failed"));
    });
  }
}

export default mfaService;
