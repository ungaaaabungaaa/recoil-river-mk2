import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

import { normalizeEmail, validatePassword } from "./lib/auth";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: normalizeEmail(params.email),
        };
      },
      validatePasswordRequirements(password) {
        validatePassword(password);
      },
    }),
  ],
});
