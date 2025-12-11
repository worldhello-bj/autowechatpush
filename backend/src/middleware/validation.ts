import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/index.js';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.parse(data);
      
      // Replace the original data with parsed/validated data
      // This ensures default values and transformations are applied
      if (source === 'body') {
        req.body = result;
      } else if (source === 'query') {
        (req as any).query = result;
      } else if (source === 'params') {
        (req as any).params = result;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          formattedErrors
        );
      }
      
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data');
    }
  };
};

/**
 * Validate multiple sources at once
 */
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        (req as any).query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        (req as any).params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Invalid request data',
          formattedErrors
        );
      }
      
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data');
    }
  };
};
