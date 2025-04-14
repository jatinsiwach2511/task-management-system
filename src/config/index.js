/* eslint-disable no-console */
import convict from 'convict';
import dotenv from 'dotenv';

dotenv.config();

const configLoader = convict({
  env: {
    format: ['prod', 'dev', 'stage'],
    default: 'dev',
    arg: 'nodeEnv',
    env: 'NODE_ENV',
  },
  port: {
    format: 'port',
    default: 8080,
    env: 'PORT',
  },
  featureLevel: {
    format: ['development', 'staging', 'production'],
    default: 'development',
    env: 'FEATURE_LEVEL',
  },
  db: {
    credentials: {
      user: {
        format: String,
        default: '',
        env: 'DB_USER',
      },
      password: {
        format: String,
        default: '',
        env: 'DB_PASSWORD',
      },
    },
    host: {
      format: String,
      default: '',
      env: 'DB_HOST',
    },
    name: {
      format: String,
      default: '',
      env: 'DB_NAME',
    },
    port: {
      format: 'port',
      default: 5432,
      env: 'DB_PORT',
    },
  },
  authTokens: {
    privateKey: {
      format: '*',
      default: '',
      env: 'JWT_PRIVATE_KEY',
    },
    publicKey: {
      format: '*',
      default: '',
      env: 'JWT_PUBLIC_KEY',
    },
    tempPrivateKey: {
      format: '*',
      default: '',
      env: 'JWT_TEMP_PRIVATE_KEY',
    },
    tempPublicKey: {
      format: '*',
      default: '',
      env: 'JWT_TEMP_PUBLIC_KEY',
    },
    issuer: {
      format: String,
      default: '[project_name]',
    },
    algorithm: {
      format: String,
      default: 'RS256',
    },
    audience: {
      web: {
        format: String,
        default: 'WEB',
      },
      app: {
        format: String,
        default: 'APP',
      },
    },
    version: {
      format: 'int',
      default: 1,
    },
    tokenType: {
      access: {
        format: String,
        default: 'ACCESS_TOKEN',
      },
      preAuth: {
        format: String,
        default: 'PRE_AUTH_TOKEN',
      },
    },
  },
  encryptionKey: {
    format: String,
    default: '',
    env: 'ENCRYPTION_KEY',
  },
  email: {
    format: String,
    default: '',
    env: 'EMAIL',
    doc: 'The email address used for sending emails from the system',
  },
  emailPass: {
    format: String,
    default: '',
    env: 'EMAIL_PASS',
    sensitive: true,
    doc: 'The password for the email account',
  },
  twilio: {
    accountSid: {
      format: String,
      default: '',
      env: 'TWILIO_SID',
      sensitive: true,
      doc: 'Twilio Account SID',
    },
    authToken: {
      format: String,
      default: '',
      env: 'TWILIO_AUTH_TOKEN',
      sensitive: true,
      doc: 'Twilio Auth Token',
    },
    phoneNumber: {
      format: String,
      default: '',
      env: 'TWILIO_PHONE_NUMBER',
      doc: 'Twilio purchased phone number in E.164 format (+1234567890)',
    },
  },
});

configLoader.validate({ allowed: 'strict' });
const config = configLoader.getProperties();
export default config;
