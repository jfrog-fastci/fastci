/**
 * Base URL for the site (e.g. '/' or '/fastci/').
 * Use basePath() for asset/link paths to avoid protocol-relative URL bugs
 * when base is '/' (e.g. "//logo.svg" being parsed as host "logo.svg").
 */
const raw = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
export const baseUrl = raw || '/';

/** Builds a path from base, avoiding double-slash protocol-relative URLs. */
export function basePath(path: string): string {
  const clean = path.replace(/^\//, '');
  return `${baseUrl}/${clean}`.replace(/\/+/g, '/');
}
