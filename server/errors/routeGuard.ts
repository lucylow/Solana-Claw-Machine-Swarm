import type { NextFunction, Request, Response } from "express";
import { logStructuredError } from "./logStructuredError";
import { normalizeServerError } from "./normalizeServerError";
import { sendAppError } from "./httpRespond";

type AsyncRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncRoute(
  handler: AsyncRoute,
  routeLabel?: string,
): AsyncRoute {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      const appError = normalizeServerError(error, {
        route: routeLabel ?? req.path,
        requestId: String(req.headers["x-request-id"] || ""),
        walletAddress:
          typeof req.query.walletAddress === "string"
            ? req.query.walletAddress
            : undefined,
      });
      logStructuredError(appError, {
        route: req.path,
        requestId: String(req.headers["x-request-id"] || ""),
      });
      if (!res.headersSent) {
        sendAppError(res, appError);
      } else {
        next(error);
      }
    }
  };
}
