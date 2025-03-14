// const { logger } = require("../logger");
const Exception = require("./exception");
// const Sentry = require("@sentry/node");

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}.`;
  return new Exception(message, 400);
};

const handleDuplicateFieldsDB = (error) => {
  const value = error?.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `The email you entered is already registered. Try using another email!`;
  return new Exception(message, 400);
};

const handleValidationErrorDB = (error, msg = "") => {
  const errors = Object.values(error?.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new Exception(msg.length ? msg : message, 400);
};

const handleJWTError = () => {
  return new Exception("Invalid token. Please log in again!", 401);
};

const handleJWTExpiredError = () => {
  return new Exception("Your token has expired! Please log in again.", 401);
};

const handleUnknown = () => {
  return new Exception("An Internal Error has occurred, Please try later", 500);
};

exports.handleFastestValidation = (message) => {
  var error = new Exception(message, 406);
  // Sentry.captureException(error);
};


exports.errorHandler = (
  error,
  msg = "Unknown Error has occurred, Please try later"
) => {  

  if (error === null || error === undefined) return msg;
 
  switch (error.code || error.statusCode) {
    case 11000:
      error = handleDuplicateFieldsDB(error);
      break;
    case 400:
      error = error;
      break;
    default:
      error = handleUnknown();
      break;
  }

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.name === "ValidationError")
    error = handleValidationErrorDB(error, msg);
  if (error.name === "JsonWebTokenError") error = handleJWTError();
  if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

  console.log(error);

  // Sentry.captureException(error);
  return error?.message;
};
