import { route } from "./utils";
import pingRoutes from "./pingRoutes";
import securityRoutes from "./securityRoutes";
import userRoutes from "./userRoutes";
import testApiRoutes from "./testRoutes";
import mfaRoutes from "./mfaRoutes";

/* Add more imports here */

// guaranteed to get dependencies
export default () => {
  pingRoutes();
  securityRoutes();
  userRoutes();
  testApiRoutes();
  mfaRoutes();
  /* Add more routes export here */
  return route;
};
