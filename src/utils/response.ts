import { Response } from 'express';

export const successResponse = (
  res: Response,
  statusCode: number = 200,
  message: string = 'Success',
  data: unknown = null
): Response => {
  const response: Record<string, unknown> = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  statusCode: number = 500,
  message: string = 'Internal Server Error',
  errors: unknown = null
): Response => {
  const response: Record<string, unknown> = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};
