export class AndersendApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = "AndersendApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}
