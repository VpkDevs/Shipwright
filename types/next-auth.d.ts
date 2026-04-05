import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** GitHub OAuth access token, available after successful authentication */
      accessToken?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** GitHub OAuth access token stored in the JWT */
    accessToken?: string;
    profile?: unknown;
  }
}
