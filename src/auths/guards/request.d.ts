declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      type: string;
      sub: string;
    };
  }
}
