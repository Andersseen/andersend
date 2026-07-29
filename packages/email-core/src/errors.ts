export class EmailProviderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EmailProviderError";
    this.code = code;
  }
}
