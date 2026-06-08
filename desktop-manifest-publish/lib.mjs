// @ts-check
export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[desktop-manifest] missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}
