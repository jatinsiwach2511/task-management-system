class TokenValidationResult {
  static tokenValidationStatus = Object.freeze({
    VALID: 'VALID',
    EXPIRED: 'EXPIRED',
    INVALID_USER: 'INVALID_USER',
    INACTIVE_USER: 'INACTIVE_USER',
    OLD_VERSION: 'OLD_VERSION',
  });

  constructor(status, user, type) {
    this.status = status;
    this.user = user;
    this.type = type;
  }

  isValid() {
    return this.status === TokenValidationResult.tokenValidationStatus.VALID;
  }
}

export default TokenValidationResult;
