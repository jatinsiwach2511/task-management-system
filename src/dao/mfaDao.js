import { QueryBuilder } from "./helper";
import { VERIFICATION_PURPOSE } from "../utils";

class mfaDao {
  static upsert = (tableName) =>
    `WITH deleted AS (DELETE FROM ${tableName} WHERE userid = ?)`;

  static selectTokenQuery = (tableName, isTotp = false) => {
    return `SELECT ${
      !isTotp ? "verification_token, token_expires_at" : "authenticator_secret"
    } FROM ${tableName} WHERE userid=$1`;
  };

  static mfaStatus = (tableName) => {
    return `SELECT is_verified FROM ${tableName} WHERE userid = $1 LIMIT 1`;
  };

  async pushTempEmailOtp(client, dto, userId) {
    const qb = new QueryBuilder(mfaDao.upsert("temp_mfa_email_method"), [
      userId,
    ]);
    qb.append(
      `INSERT INTO temp_mfa_email_method (userid, email, verification_token) 
VALUES (?,?,?)`,
      [userId, dto.email, dto.otp]
    );
    const { sql, args } = qb.build();
    await client.query(sql, args);
    return true;
  }

  async pushTempPhoneOtp(client, dto, userId) {
    const qb = new QueryBuilder(mfaDao.upsert("temp_mfa_phone_method"), [
      userId,
    ]);
    qb.append(
      `INSERT INTO temp_mfa_phone_method (userid,phone, verification_token) 
VALUES (?,?,?)`,
      [userId, dto.phone, dto.otp]
    );
    const { sql, args } = qb.build();
    await client.query(sql, args);
    return true;
  }
  async addTempMfaSecret(client, dto, userId) {
    const qb = new QueryBuilder(mfaDao.upsert("temp_mfa_totp_method"), [
      userId,
    ]);
    qb.append(
      `INSERT INTO temp_mfa_totp_method (userid,authenticator_secret) 
VALUES (?,?)`,
      [userId, dto.secret]
    );
    const { sql, args } = qb.build();
    await client.query(sql, args);
    return true;
  }
  async addMfaSecret(client, dto, userId) {
    const qb = new QueryBuilder(mfaDao.upsert("mfa_totp_method"), [userId]);
    qb.append(
      `INSERT INTO mfa_totp_method (userid,authenticator_secret) 
VALUES (?,?)`,
      [userId, dto.secret]
    );
    const { sql, args } = qb.build();
    await client.query(sql, args);
    return true;
  }

  async getMobileOtp(client, userId, purpose) {
    const tableName =
      purpose === VERIFICATION_PURPOSE.MFASETUP
        ? "temp_mfa_phone_method"
        : "mfa_phone_method";
    const res = await client.query(mfaDao.selectTokenQuery(tableName), [
      userId,
    ]);
    return res.rows[0];
  }

  async getEmailOtp(client, userId, purpose) {
    const tableName =
      purpose === VERIFICATION_PURPOSE.MFASETUP
        ? "temp_mfa_email_method"
        : "mfa_email_method";
    const res = await client.query(mfaDao.selectTokenQuery(tableName), [
      userId,
    ]);
    return res.rows[0];
  }

  async gettotpSecret(client, userId, purpose) {
    const tableName =
      purpose === VERIFICATION_PURPOSE.MFASETUP
        ? "temp_mfa_totp_method"
        : "mfa_totp_method";
    const res = await client.query(mfaDao.selectTokenQuery(tableName, true), [
      userId,
    ]);
    console.log("===totp secret", res);
    return res.rows[0];
  }

  async verifyEmail(client, userId, purpose) {
    const tableName =
      purpose === VERIFICATION_PURPOSE.MFASETUP
        ? "temp_mfa_email_method"
        : "mfa_email_method";
    const res = await client.query(
      `UPDATE ${tableName} SET is_verified=$1 WHERE userid=$2`,
      [true, userId]
    );
  }

  async verifyPhone(client, userId, purpose) {
    const tableName =
      purpose === VERIFICATION_PURPOSE.MFASETUP
        ? "temp_mfa_phone_method"
        : "mfa_phone_method";
    const res = await client.query(
      `UPDATE ${tableName} SET is_verified=$1 WHERE userid=$2`,
      [true, userId]
    );
  }

  async verifyTotp(client, userId, purpose) {
    const tableName =
      purpose === VERIFICATION_PURPOSE.MFASETUP
        ? "temp_mfa_totp_method"
        : "mfa_totp_method";
    const res = await client.query(
      `UPDATE ${tableName} SET is_verified=$1 WHERE userid=$2`,
      [true, userId]
    );
    return true;
  }

  async isMfaFullyVerified(client, userId, purpose) {
    const tablePrefix =
      purpose === VERIFICATION_PURPOSE.MFASETUP ? "temp_" : "";
    const qb = new QueryBuilder(
      `SELECT COALESCE( (${mfaDao.mfaStatus(
        `${tablePrefix}mfa_email_method`
      )} ),true) AS email_verified,`
    );
    qb.append(
      ` COALESCE( (${mfaDao.mfaStatus(
        `${tablePrefix}mfa_phone_method`
      )} ),true) AS phone_verified,`
    );
    qb.append(
      ` COALESCE( (${mfaDao.mfaStatus(
        `${tablePrefix}mfa_totp_method`
      )} ),true) AS totp_verified`,
      [userId]
    );
    const { sql, args } = qb.build();
    const res = await client.query(sql, args);
    return res.rows[0];
  }
  async migrateEmailMfaRecord(client, userId) {
    await client.query(
      "INSERT INTO mfa_email_method (userid, email) SELECT userid,email FROM temp_mfa_email_method WHERE id = $1;",
      [userId]
    );
    await client.query("DELETE FROM temp_mfa_email_method WHERE id = $1;", [
      userId,
    ]);
  }
  async migratePhoneMfaRecord(client, userId) {
    await client.query(
      "INSERT INTO mfa_phone_method (userid, phone) SELECT userid,phone FROM temp_mfa_phone_method WHERE id = $1;",
      [userId]
    );
    await client.query("DELETE FROM temp_mfa_phone_method WHERE id = $1;", [
      userId,
    ]);
  }
  async migrateTotpMfaRecord(client, userId) {
    await client.query(
      "INSERT INTO mfa_totp_method (userid, authenticator_secret) SELECT userid,authenticator_secret FROM temp_mfa_totp_method WHERE id = $1;",
      [userId]
    );
    await client.query("DELETE FROM temp_mfa_totp_method WHERE id = $1;", [
      userId,
    ]);
  }
  async enableMfa(client, userId) {
    await client.query(
      `UPDATE user_details SET is_mfa_enabled =$1 WHERE user_id = $2`,
      [true, userId]
    );
  }
}
export default mfaDao;
