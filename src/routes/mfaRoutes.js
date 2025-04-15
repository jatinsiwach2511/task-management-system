import { Container } from 'typedi';
import { routes, featureLevel, get, post } from './utils';
import { setupMfa, verifyOtp } from '../models/schemas';
import { mfaService, SecurityService } from '../services';
import { Right } from '../auth';
import { VERIFICATION_PURPOSE } from '../utils';

export default () => {
  post(
    featureLevel.production,
    Right.user.SETUP_MFA,
    routes.mfa.SETUP_MFA,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await setupMfa.validateAsync(req.body);
      const txn = Container.get('DbTransactions');
      return await txn.withTransaction(async (client) => {
        return await service.setupMfa({ ...req.currentUser }, dto, client);
      });
    }
  );
  post(
    featureLevel.production,
    Right.user.SETUP_MFA,
    routes.mfa.VALIDATE_EMAIL,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await verifyOtp.validateAsync(req.body);
      return await service.verifyEmail(
        { ...req.currentUser },
        dto,
        VERIFICATION_PURPOSE.MFASETUP
      );
    }
  );
  post(
    featureLevel.production,
    Right.user.SETUP_MFA,
    routes.mfa.VALIDATE_PHONE,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await verifyOtp.validateAsync(req.body);

      return await service.verifyPhone(
        { ...req.currentUser },
        dto,
        VERIFICATION_PURPOSE.MFASETUP
      );
    }
  );
  post(
    featureLevel.production,
    Right.user.SETUP_MFA,
    routes.mfa.VALIDATE_TOTP,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await verifyOtp.validateAsync(req.body);

      return await service.verifyTotp(
        { ...req.currentUser },
        dto,
        VERIFICATION_PURPOSE.MFASETUP
      );
    }
  );
  post(
    featureLevel.production,
    Right.userMfa.VERIFY_USER_EMAIL,
    routes.mfa.VERIFY_USER_EMAIL,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await verifyOtp.validateAsync(req.body);

      return await service.verifyEmail(
        { ...req.currentUser },
        dto,
        VERIFICATION_PURPOSE.LOGIN
      );
    }
  );
  post(
    featureLevel.production,
    Right.userMfa.VERIFY_USER_PHONE,
    routes.mfa.VERIFY_USER_PHONE,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await verifyOtp.validateAsync(req.body);

      return await service.verifyPhone(
        { ...req.currentUser },
        dto,
        VERIFICATION_PURPOSE.LOGIN
      );
    }
  );
  post(
    featureLevel.production,
    Right.userMfa.VERIFY_USER_TOTP,
    routes.mfa.VERIFY_USER_TOTP,
    async (req) => {
      const service = Container.get(mfaService);
      const dto = await verifyOtp.validateAsync(req.body);

      return await service.verifyTotp(
        { ...req.currentUser },
        dto,
        VERIFICATION_PURPOSE.LOGIN
      );
    }
  );

  get(
    featureLevel.production,
    Right.user.COMPLETE_MFA,
    routes.mfa.COMPLETE_MFA,
    async (req) => {
      const service = Container.get(mfaService);
      return await service.completeMfa({ ...req.currentUser });
    }
  );

  get(
    featureLevel.production,
    Right.userMfa.VERIFY_ALL_METHODS,
    routes.mfa.VERIFY_ALL_METHODS,
    async (req) => {
      const service = Container.get(mfaService);
      const securityService = Container.get(SecurityService);
      return await service.verifyAllMethods(securityService, {
        ...req.currentUser,
      });
    }
  );
};
