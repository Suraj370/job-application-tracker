export interface JwtPayload {
  id: string;
}

declare global {
  namespace Express {
    export interface Request {
      user?: JwtPayload; 
    }
  }
}