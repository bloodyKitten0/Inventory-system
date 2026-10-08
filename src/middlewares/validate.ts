import type { Request, Response, NextFunction } from "express";

interface FieldRules {
  required?: boolean;
  type?: string;
  trim?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  integer?: boolean;
  min?: number;
  max?: number;
  finite?: boolean;
  notEqual?: unknown;
  email?: boolean;
  enum?: unknown[];
  custom?: (
    value: unknown,
    data: Record<string, unknown>,
  ) => boolean | string | undefined;
}

type Schema = Record<string, Record<string, FieldRules>>;

interface ValidationError {
  field: string;
  source: string;
  message: string;
}

const NUMERIC_STRING = /^-?\d+(\.\d+)?$/;

// Route params and query values always arrive as strings. When a rule
// expects a number, a numeric string is converted before it is checked.
const coerce = (source: string, value: unknown, rules: FieldRules) => {
  if (
    (source === "params" || source === "query") &&
    rules.type === "number" &&
    typeof value === "string" &&
    NUMERIC_STRING.test(value)
  ) {
    return Number(value);
  }

  return value;
};

const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: ValidationError[] = [];

    const sources: Record<string, Record<string, unknown>> = {
      body: req.body || {},
      params: req.params || {},
      query: req.query || {},
    };

    for (const [source, fields] of Object.entries(schema)) {
      const data = sources[source] || {};

      for (const [field, rules] of Object.entries(fields)) {
        const value = coerce(source, data[field], rules);

        if (
          rules.required &&
          (value === undefined || value === null || value === "")
        ) {
          errors.push({
            field,
            source,
            message: `${field} is required`,
          });

          continue;
        }
        if (value === undefined || value === null || value === "") {
          continue;
        }
        if (rules.type && typeof value !== rules.type) {
          errors.push({
            field,
            source,
            message: `${field} must be a ${rules.type}`,
          });

          continue;
        }
        if (rules.trim && typeof value === "string" && value.trim() !== value) {
          errors.push({
            field,
            source,
            message: `${field} must not have leading or trailing whitespace`,
          });
        }
        if (
          rules.minLength !== undefined &&
          typeof value === "string" &&
          value.trim().length < rules.minLength
        ) {
          errors.push({
            field,
            source,
            message: `${field} must be at least ${rules.minLength} characters`,
          });
        }
        if (
          rules.maxLength !== undefined &&
          typeof value === "string" &&
          value.trim().length > rules.maxLength
        ) {
          errors.push({
            field,
            source,
            message: `${field} must be at most ${rules.maxLength} characters`,
          });
        }
        if (
          rules.pattern &&
          typeof value === "string" &&
          !rules.pattern.test(value)
        ) {
          errors.push({
            field,
            source,
            message: `${field} has an invalid format`,
          });
        }
        if (rules.integer && !Number.isInteger(value)) {
          errors.push({
            field,
            source,
            message: `${field} must be an integer`,
          });
        }
        if (
          rules.min !== undefined &&
          typeof value === "number" &&
          value < rules.min
        ) {
          errors.push({
            field,
            source,
            message: `${field} must be at least ${rules.min}`,
          });
        }
        if (
          rules.max !== undefined &&
          typeof value === "number" &&
          value > rules.max
        ) {
          errors.push({
            field,
            source,
            message: `${field} must be at most ${rules.max}`,
          });
        }
        if (
          rules.finite &&
          typeof value === "number" &&
          !Number.isFinite(value)
        ) {
          errors.push({
            field,
            source,
            message: `${field} must be a finite number`,
          });
        }
        if (rules.notEqual !== undefined && value === rules.notEqual) {
          errors.push({
            field,
            source,
            message: `${field} must not equal ${rules.notEqual}`,
          });
        }
        if (rules.email && typeof value === "string") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            errors.push({
              field,
              source,
              message: `${field} must be a valid email`,
            });
          }
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            field,
            source,
            message: `${field} must be one of: ${rules.enum.join(", ")}`,
          });
        }
        if (rules.custom) {
          const result = rules.custom(value, data);

          if (result !== true) {
            errors.push({
              field,
              source,
              message: result || `${field} is invalid`,
            });
          }
        }
      }
    }
    if (errors.length > 0) {
      res.status(400).json({
        message: "Validation failed",
        errors,
      });
      return;
    }

    next();
  };
};

export default validate;
export type { FieldRules, Schema };
