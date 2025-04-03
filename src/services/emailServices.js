import nodemailer from "nodemailer";
import config from "../config";

class EmailService {
  static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.email,
      pass: config.emailPass,
    },
  });

  static getTransporter() {
    return this.transporter;
  }

  static async sendMail(mailOptions) {
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EmailService;
