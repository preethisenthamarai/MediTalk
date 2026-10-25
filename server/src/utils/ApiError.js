export class ApiError extends Error {
  constructor(status, message, code, extra) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra; // optional extra fields sent to the client (e.g. which portal an account belongs to)
  }
}
