import type { Response } from "express";
import type { AppError } from "@shared/errorTypes";

export function sendAppError(res: Response, appError: AppError, statusOverride?: number) {
  const status = statusOverride ?? appError.statusCode ?? 400;
  res.status(status).json({ ok: false as const, error: { ...appError, statusCode: status } });
}

export function sendAppOk<T>(
  res: Response,
  data: T,
  opts?: { degraded?: boolean; status?: number }
) {
  const status = opts?.status ?? 200;
  res.status(status).json({
    ok: true as const,
    data,
    ...(opts?.degraded !== undefined ? { degraded: opts.degraded } : {}),
  });
}
