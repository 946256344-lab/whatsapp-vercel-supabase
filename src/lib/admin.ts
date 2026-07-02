import { optionalEnv } from "./env";

export function isAdminTokenValid(token: string | null): boolean {
  const expected = optionalEnv("ADMIN_TOKEN");
  return Boolean(expected && token && token === expected);
}
