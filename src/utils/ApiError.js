// API Custom Erros generator class
class ApiError extends error {
  constructor(
    statuscode,
    message = "Something went wrong",
    statck = "",
    errors = []
  ) {
    super(message);
    this.statuscode = statuscode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (statck) {
      this.stack = statch;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
