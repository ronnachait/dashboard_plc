// global.d.ts

declare module "next/dist/compiled/webpack/webpack" {
  import * as webpack from "webpack";
  export = webpack;
}

declare module "next/dist/compiled/superstruct" {
  export * from "superstruct";
}

declare module "next/dist/compiled/amphtml-validator" {
  export interface ValidationError {
    severity: string;
    line: number;
    col: number;
    message: string;
    specUrl: string;
  }

  export interface ValidationResult {
    status: "PASS" | "FAIL";
    errors: ValidationError[];
  }

  export interface Validator {
    validateString(html: string): ValidationResult;
    validateUrl(url: string): Promise<ValidationResult>;
  }

  export function getInstance(): Promise<Validator>;
}
