import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/express"; // <-- 1. Import our custom type

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      

      // 2. Verify the token and cast it to our JwtPayload type
      const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as JwtPayload;

      // 3. NO @ts-ignore needed! TypeScript now knows req.user exists.
      req.user = { id: decoded.id };

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token." });
  }
};
