import fs from 'node:fs';
import path from 'node:path';

export const FETCH_TIMEOUT_MS = 20_000;

/** fetch with a ~20s ceiling so a hung source does not block the after-close run. */
export async function fetchWithTimeout(url, init = {}) {
  const { signal: callerSignal, ...rest } = init;
  const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const signal = callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout;
  return fetch(url, { ...rest, signal });
}

/** Write JSON (or any UTF-8 text) via a temp file in the same directory, then rename. */
export function writeFileAtomic(file, content) {
  const dir = path.dirname(file);
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.tmp`);
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}
