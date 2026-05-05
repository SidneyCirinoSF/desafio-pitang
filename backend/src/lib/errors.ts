export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: number = 400, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.error = getErrorText(statusCode);
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function getErrorText(statusCode: number): string {
  const map: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
  };
  return map[statusCode] ?? "Error";
}
