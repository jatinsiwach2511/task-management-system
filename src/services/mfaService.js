import { Container } from 'typedi';
import { mfaDao } from '../dao';
import { Promise } from 'bluebird';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import {
  HttpException,
  STATUS,
  formatErrorResponse,
  formatSuccessResponse,
  messageResponse,
  VERIFICATION_purpose,
} from '../utils';
import { EmailService, smsService } from './index';
import { Password } from '../models';

class mfaService {
  constructor() {
    this.txs = Container.get('DbTransactions');
    this.dao = Container.get(mfaDao);
    this.emailService = Container.get(EmailService);
    this.smsService = Container.get(smsService);
  }
  static generateSecret(identifier = 'user') {
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
      encoding: 'base32',
      token: token,
      window: 1,
    });
  }

  async sendEmailOtp(email, otp) {
    this.emailService.sendMail({
      to: email,
      subject: 'MFA otp verification',
      text: `Your OTP for email verification is ${otp}`,
    });
  }

  async setupMfa(actionUser, dto, client) {
    const options = dto?.selectedMethods || [];
    const messageKey = 'setupMfa';
    const formattedMethods = {};
    for (const method of options) {
      if (method !== 'totp') {
        if (!dto[method]) {
          throw new HttpException.BadRequest(
            formatErrorResponse(messageKey, 'methodRequired')
          );
        }
        formattedMethods[method] = dto[method];
      } else {
        formattedMethods[method] = true;
      }
    }
    let totp = null;
    for (const method of options) {
      switch (method) {
        case 'email':
          const otp = mfaService.generateOtp();
          const res = await this.dao.pushTempEmailOtp(
            client,
            { email: formattedMethods[method], otp: otp.toString() },
            actionUser.id
          );
          await this.sendEmailOtp(formattedMethods[method], otp);
          break;
        case 'phone':
          const phoneOtp = mfaService.generateOtp();
          await this.dao.pushTempPhoneOtp(
            client,
            { phone: formattedMethods[method], otp: phoneOtp.toString() },
            actionUser.id
          );
          const otpMessage = `hii there i am you friend want to send this friendly messag ewith a sample otp ${phoneOtp}`;
          await this.smsService.sendSms(formattedMethods[method], otpMessage);
          break;

        case 'totp':
          const secret = mfaService.generateSecret(actionUser.firstName);
          await this.dao.addTempMfaSecret(
            client,
            { secret: secret.base32 },
            actionUser.id
          );
          const asyncUrlGenerateFunc = Promise.promisify(qrcode.toDataURL, {
            multiArgs: true,
            context: qrcode,
          });
          const data = await asyncUrlGenerateFunc(secret.otpauth_url);
          totp = data;
          break;
      }
    }
    if (totp) {
      return { qrCode: totp };
    }
    return messageResponse(formatSuccessResponse(messageKey, 'sent'));
  }

  async verifyEmail(actionUser, dto, purpose) {
    const messageKey = 'verifyEmail';
    return this.txs.withTransaction(async (client) => {
      const res = await this.dao.getEmailOtp(client, actionUser.id, purpose);
      if (dto.otp === res.verification_token) {
        await this.dao.verifyEmail(client, actionUser.id, purpose);
        return messageResponse(formatSuccessResponse(messageKey, 'success'));
      }
      return messageResponse(formatSuccessResponse(messageKey, 'failed'));
    });
  }

  async verifyPhone(actionUser, dto, purpose) {
    const messageKey = 'verifyPhone';
    return this.txs.withTransaction(async (client) => {
      const res = await this.dao.getMobileOtp(client, actionUser.id, purpose);
      if (dto.otp === res.verification_token) {
        await this.dao.verifyPhone(client, actionUser.id, purpose);
        return messageResponse(formatSuccessResponse(messageKey, 'success'));
      }
      return messageResponse(formatSuccessResponse(messageKey, 'failed'));
    });
  }

  async verifyTotp(actionUser, dto, purpose) {
    const messageKey = 'verifyTotp';
    return this.txs.withTransaction(async (client) => {
      const res = await this.dao.gettotpSecret(client, actionUser.id, purpose);
      const isvalidOtp = await mfaService.validateTotp(
        res.authenticator_secret,
        dto.otp
      );
      if (isvalidOtp) {
        await this.dao.verifyTotp(client, actionUser.id, purpose);
        return messageResponse(formatSuccessResponse(messageKey, 'success'));
      }
      return messageResponse(formatSuccessResponse(messageKey, 'failed'));
    });
  }
}

export default mfaService;
