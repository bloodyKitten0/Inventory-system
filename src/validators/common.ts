const positiveInteger = {
  required: true,
  type: "number",
  integer: true,
  min: 1,
};

const nonNegativeNumber = {
  required: true,
  type: "number",
  finite: true,
  min: 0,
};

const positiveNumber = {
  required: true,
  type: "number",
  finite: true,
  min: 0.000001,
};

const requiredString = (minLength: number = 1, maxLength?: number) => ({
  required: true,
  type: "string",
  minLength,
  ...(maxLength ? { maxLength } : {}),
});

const email = {
  required: true,
  type: "string",
  email: true,
  maxLength: 254,
};

export {
  positiveInteger,
  nonNegativeNumber,
  positiveNumber,
  requiredString,
  email,
};
