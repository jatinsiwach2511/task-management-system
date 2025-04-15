import { Container } from "typedi";
import jwt from "jsonwebtoken";
import moment from "moment";
import config from "../config";
import {
  HttpException,
  encrypt,
  decrypt,
  formatErrorResponse,
  STATUS,
  VERIFICATION_PURPOSE,
} from "../utils";
import { Authentication, Right, TokenValidationResult, Role } from "../auth";
import UserService from "./userService";
import mfaService from "./mfaService";

class SecurityService {
  static TOKEN_EXPIRATION_MINUTES = 1;

  static SAME_IP_TOKEN_EXPIRATION_MINUTES = 60;

  static TEMP_TOKEN_EXPIRATION_MINUTES = 5;

  static MAX_LOGIN_ATTEMPTS = 3;

  static ACCOUNT_BLOCK_HOURS = 1;

  constructor() {
    this.txs = Container.get("DbTransactions");
    this.userService = Container.get(UserService);
    this.mfaService = Container.get(mfaService);
  }

  async updateUserWrongLoginCount(user) {
    let wrongLoginCount = (user.wrongLoginCount || 0) + 1;
    if (wrongLoginCount > SecurityService.MAX_LOGIN_ATTEMPTS)
      wrongLoginCount = 1;
    await this.userService.updateUserWrongLoginCount(wrongLoginCount, user.id);
  }

  async postLoginActions(client, userId) {
    await this.userService.markUserLogin(client, userId);
  }

  async login(ipAddress, email, password) {
    return await this.txs.withTransaction(async (client) => {
      const messageKey = "login";
      const invalidLoginErr = new HttpException.Forbidden(
        formatErrorResponse(messageKey, "invalidCredentials")
      );
      const user = await this.userService.findUserByEmail(client, email);
      if (!user || !user.passwordHash) {
        throw invalidLoginErr;
      }

      if (SecurityService.accountBlocked(user)) {
        throw new HttpException.Forbidden(
          formatErrorResponse(messageKey, "accountBlocked")
        );
      }

      const validPassword = await user.passwordHash.check(password);

      if (validPassword && (await this.canLogin(user))) {
        const roleIds = user.roles.map((role) => role.getId());
        const type = Math.max(...roleIds);
        if (!user.is_mfa_enabled) {
          const token = SecurityService.createToken(
            ipAddress,
            user.email,
            config.authTokens.audience.app,
            type,
            !user.lastLogin
          );
          await this.postLoginActions(client, user.id);
          return { token };
        } else {
          const methods = await this.mfaService.getUserSelectedMfaMethods(
            client,
            user.id
          );
          const token = SecurityService.createTempToken(
            ipAddress,
            user.email,
            config.authTokens.audience.app,
            type,
            !user.lastLogin,
            Object.keys(methods) // {email: "abc@gamil.com, phone: '1234567890"}
          );
          console.log("the methods are======0", methods);
          await this.mfaService.sendOtps(
            client,
            methods,
            user,
            VERIFICATION_PURPOSE.LOGIN
          );
          return { token };
        }
      }
      this.updateUserWrongLoginCount(user);
      throw invalidLoginErr;
    });
  }

  /** Used to signup only mobile app users */
  async signUp(ipAddress, signUpDto) {
    return await this.txs.withTransaction(async (client) => {
      const user = await this.userService.createUser(client, {
        ...signUpDto,
        role: Role.roleValues.USER,
      });

      const token = SecurityService.createToken(
        ipAddress,
        user.email,
        config.authTokens.audience.app,
        !user.lastLogin
      );

      await this.userService.markUserLogin(client, user.id);
      return { token };
    });
  }

  static accountBlocked(user) {
    let blocked = false;
    if (
      user.wrongLoginCount >= SecurityService.MAX_LOGIN_ATTEMPTS &&
      user.lastWrongLoginAttempt
    ) {
      const bolckedTill = user.lastWrongLoginAttempt
        .clone()
        .add(SecurityService.ACCOUNT_BLOCK_HOURS, "hour");
      blocked = bolckedTill.isAfter();
    }
    return blocked;
  }

  async canLogin(user) {
    const messageKey = "user";
    if (user.status !== STATUS.ACTIVE) {
      throw new HttpException.Unauthorized(
        formatErrorResponse(messageKey, "inactiveUser")
      );
    }

    return Authentication.hasRight(user, Right.general.LOGIN);
  }

  static updateToken(ipAddress, email, aud) {
    return SecurityService.createToken(ipAddress, email, aud);
  }

  static createToken(ipAddress, email, aud, firstLogin) {
    const payload = {
      exp: SecurityService.expiryTimeStamp(
        SecurityService.TOKEN_EXPIRATION_MINUTES
      ),
      iat: SecurityService.currentTimestamp(),
      nbf: SecurityService.currentTimestamp(),
      iss: config.authTokens.issuer,
      sub: encrypt(email),
      aud: config.authTokens.audience.web,
      type: config.authTokens.tokenType.access,
      version: config.authTokens.version,
      exp2: {
        ip: ipAddress,
        time: SecurityService.expiryTimeStamp(
          SecurityService.SAME_IP_TOKEN_EXPIRATION_MINUTES
        ),
      },
      firstLogin: firstLogin || undefined,
    };
    if (aud && aud === config.authTokens.audience.app) {
      payload.aud = config.authTokens.audience.app;
      delete payload.exp;
      delete payload.exp2;
    }
    return jwt.sign(payload, config.authTokens.privateKey, {
      algorithm: config.authTokens.algorithm,
    });
  }

  static createTempToken(ipAddress, email, aud, firstLogin, methods = []) {
    const payload = {
      exp: SecurityService.expiryTimeStamp(
        SecurityService.TEMP_TOKEN_EXPIRATION_MINUTES
      ),
      iat: SecurityService.currentTimestamp(),
      nbf: SecurityService.currentTimestamp(),
      iss: config.authTokens.issuer,
      sub: encrypt(email),
      aud: config.authTokens.audience.web,
      type: config.authTokens.tokenType.preAuth,
      version: config.authTokens.version,
      methods: methods,
      exp2: {
        ip: ipAddress,
        time: SecurityService.expiryTimeStamp(
          SecurityService.SAME_IP_TOKEN_EXPIRATION_MINUTES
        ),
      },
      firstLogin: firstLogin || undefined,
    };
    if (aud && aud === config.authTokens.audience.app) {
      payload.aud = config.authTokens.audience.app;
      delete payload.exp;
      delete payload.exp2;
    }
    return jwt.sign(payload, config.authTokens.privateKey, {
      algorithm: config.authTokens.algorithm,
    });
  }

  static currentTimestamp() {
    return moment.utc().unix();
  }

  static expiryTimeStamp(time) {
    return moment().add(time, "minute").unix();
  }

  async validateToken(ip, payload) {
    if (
      payload.aud !== config.authTokens.audience.app &&
      SecurityService.isExpired(ip, payload, moment())
    ) {
      return new TokenValidationResult(
        TokenValidationResult.tokenValidationStatus.EXPIRED
      );
    }
    if (SecurityService.isOldVersion(payload)) {
      return new TokenValidationResult(
        TokenValidationResult.tokenValidationStatus.OLD_VERSION
      );
    }

    try {
      const email = decrypt(payload.sub);
      const user = await this.txs.withTransaction(async (client) =>
        this.userService.findUserByEmail(client, email)
      );

      if (!user || user.status !== STATUS.ACTIVE) {
        return new TokenValidationResult(
          TokenValidationResult.tokenValidationStatus.INACTIVE_USER
        );
      }

      return new TokenValidationResult(
        TokenValidationResult.tokenValidationStatus.VALID,
        user,
        SecurityService.tokenType(payload)
      );
    } catch (e) {
      return new TokenValidationResult(
        TokenValidationResult.tokenValidationStatus.INVALID_USER
      );
    }
  }

  static isExpired(ip, payload, currentTime) {
    return (
      !SecurityService.isValidForGeneralExpiration(currentTime, payload) &&
      !SecurityService.isValidForSameIpExpiration(currentTime, ip, payload)
    );
  }

  static isValidForGeneralExpiration(currentTime, payload) {
    return moment.unix(payload.exp).isAfter(currentTime);
  }

  static isValidForSameIpExpiration(currentTime, ip, payload) {
    return (
      ip === payload.exp2.ip &&
      moment.unix(payload.exp2.time).isAfter(currentTime)
    );
  }

  static isOldVersion(payload) {
    return config.authTokens.version !== payload.version;
  }

  static tokenType(payload) {
    return payload.type === config.authTokens.tokenType.access
      ? config.authTokens.tokenType.access
      : config.authTokens.tokenType.preAuth;
  }
}

export default SecurityService;
