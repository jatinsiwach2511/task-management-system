const API_ROOT_V1 = "/api/v1";
const USER_ROOT = `${API_ROOT_V1}/user`;
const TASK_ROOT = `${API_ROOT_V1}/task`;
const MFA_ROOT = `${API_ROOT_V1}/mfa`;

export default Object.freeze({
  ping: `${API_ROOT_V1}/ping`,
  healthCheck: `${API_ROOT_V1}/health-check`,
  security: {
    SIGN_UP: `${API_ROOT_V1}/signup`,
    LOGIN: `${API_ROOT_V1}/login`,
    SOCIAL_LOGIN: `${API_ROOT_V1}/social-login`,
  },
  mfa: {
    SETUP_MFA: `${MFA_ROOT}/setup`,
    VALIDATE_EMAIL: `${MFA_ROOT}/validate-email`,
    VERIFY_USER_EMAIL: `${MFA_ROOT}/verify-email`,
    VALIDATE_PHONE: `${MFA_ROOT}/validate-phone`,
    VERIFY_USER_PHONE: `${MFA_ROOT}/verify-phone`,
    VALIDATE_TOTP: `${MFA_ROOT}/validate-totp`,
    VERIFY_USER_TOTP: `${MFA_ROOT}/verify-totp`,
    COMPLETE_MFA: `${MFA_ROOT}/complete-mfa`,
  },
  user: {
    PROFILE: `${USER_ROOT}/profile`,
  },
  test: {
    TEST_ACTION: `${API_ROOT_V1}/test/`,
  },
  /* Add more routes here */
  task: {
    GET_ALL_TASKS: `${API_ROOT_V1}/tasks/filter`,
    GET_TASK_BY_ID: `${TASK_ROOT}/:id`,
    CREATE_TASK: `${TASK_ROOT}`,
    UPDATE_TASK: `${TASK_ROOT}/:id`,
    DELETE_TASK: `${TASK_ROOT}/:id`,
    GET_TASKS_STATUS: `${API_ROOT_V1}/tasks-status`,
    SHARE_TASK_BY_ID: `${API_ROOT_V1}/share-task/:id`,
    UPDATE_REMINDER: `${TASK_ROOT}/reminder/:id`,
    UPDATE_SHARE_TASK_PERMISSION: `${API_ROOT_V1}/share-task/:id`,
    UPDATE_TASK_DUE_DATE: `${TASK_ROOT}/due-date/:id`,
    UPDATE_USER_TASK: `${TASK_ROOT}/user-task/:id`,
  },
});
