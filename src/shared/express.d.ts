declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        email: string;
        role: 'user' | 'admin';
      };
    }
  }
}

export {};
