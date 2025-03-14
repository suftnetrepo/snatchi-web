// Define the structure for a single rule
interface Rule {
  array?: boolean;
  pattern?: RegExp;
  message: string;
  validate?: (value: any, fields: Record<string, any>) => string | undefined;
}

// Define the structure for the rules object used in validation
interface Rules {
  [key: string]: Rule[];
}

// Define the structure for the values object used in validation
interface Values {
  [key: string]: any;
}

// Define the structure for the errors object in the validation response
export interface Errors {
  [key: string]: { message: string };
}

/**
 * Validates a value against provided rules.
 * @param value - The value to validate.
 * @param rules - The array of validation rules.
 * @returns The error message if the value is invalid, otherwise undefined.
 */
const validateField = (value: any, rules: Rule[], fields: Record<string, any> = {}): string | undefined => {
  for (const rule of rules) {
    // Explicit null or undefined check
    if (value === null || value === undefined) {
      return rule.message; // Null/undefined fails required validation
    }

    // Array validation
    if (rule.array && Array.isArray(value) && value.length === 0) {
      return rule.message;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }

    // Custom validation logic
    if (rule.validate) {
      const customMessage = rule.validate(value, fields);
      if (customMessage) {
        return customMessage;
      }
    }
  }

  return undefined; // No errors found
};


/**
 * Validates a set of values against a set of field rules.
 * @param values - The object of field values.
 * @param rules - The object of field rules.
 * @returns An object containing a boolean indicating if there are errors, and an object of errors.
 */
const validate = (values: Values, rules: Rules): { hasError: boolean; errors: Errors } => {
  const errors: Errors = {};
  let hasError = false;

  for (const field in rules) {
    const fieldRules = rules[field];
    const value = values[field] ?? null; // Safely access values[field]
    const error = validateField(value, fieldRules, values); // Pass `values` for cross-field validation

    if (error) {
      hasError = true;
      errors[field] = { message: error };
    }
  }

  return {
    hasError,
    errors
  };
};

export { validate };
