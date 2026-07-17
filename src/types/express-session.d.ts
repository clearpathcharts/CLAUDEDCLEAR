import 'express-session';

declare module 'express-session' {
  interface SessionData {
    privateUser?: {
      uid: string;
      email: string;
      displayName: string;
    };
  }
}

declare namespace Express {
  interface Request {
    session: import('express-session').Session & Partial<import('express-session').SessionData>;
  }
}
