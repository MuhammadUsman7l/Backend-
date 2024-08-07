// API Custom Erros generator class
class ApiError extends error {
  constructor(
    statuscode,
    message = "Something went wrong",
    stack = "",
    errors = []
  ) {
    super(message);
    this.statuscode = statuscode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
