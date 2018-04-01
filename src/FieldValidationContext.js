// @flow

// See https://github.com/aldeed/simple-schema-js#custom-field-validation

export type ValidationError = {
  name: string,
  type: string
};

export type FieldValidationContext = {
  key: string,
  genericKey: string,
  definition: { [string]: {} },
  isSet: boolean,
  value: any,
  operator: ?string,
  validationContext: {},
  field: ((string) => { isSet: boolean, value: any, operator: ?string }),
  siblingField: ((string) => { isSet: boolean, value: any, operator: ?string }),
  addValidationErrors: ((errors: ValidationError[]) => void),
};
