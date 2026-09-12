const positiveInteger = {
  type: "number",
  integer: true,
  min: 1,
};

const nonNegativeNumber = {
  type: "number",
  finite: true,
  min: 0,
};

const positiveNumber = {
  type: "number",
  finite: true,
  min: 0.000001,
};

const requiredString = (minLength = 1, maxLength) => ({
  type: "string",
  minLength,
  ...(maxLength ? { maxLength } : {}),
});

const email = {
  type: "string",
  email: true,
  maxLength: 254,
};

module.exports = {
  positiveInteger,
  nonNegativeNumber,
  positiveNumber,
  requiredString,
  email,
};
//
