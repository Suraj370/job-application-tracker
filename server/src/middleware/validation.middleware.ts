import type{ Request, Response, NextFunction } from "express";
import * as v from "valibot";

export const validate =
  (schema: v.BaseSchema<any, any, any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = v.safeParse(schema, req.body);

    if (!result.success) {
      const errors = result.issues.map((issue) => ({
        path: issue.path?.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        status: "error",
        errors,
      });
    }

    req.body = result.output; // ✅ validated + transformed
    next();
  };
