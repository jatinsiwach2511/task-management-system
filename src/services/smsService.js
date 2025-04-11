import twilio from "twilio";
import config from "../config";

class smsService {
  constructor() {
    this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  async sendSms(phone, message) {
    await this.client.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: phone,
    });
  }
}

export default smsService;
