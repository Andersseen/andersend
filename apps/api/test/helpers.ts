/** Parses a fetch `Response` body for assertions against a dynamically-shaped JSON payload. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(response: Response): Promise<any> {
  return response.json();
}
