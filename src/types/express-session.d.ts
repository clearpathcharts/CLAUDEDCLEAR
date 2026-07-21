import 'express-serve-static-core';
import type session from 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}

declare module 'express-session' {
  interface SessionData {
    privateUser?: {
      uid: string;
      email: string;
      displayName: string;
    };
  }
}
