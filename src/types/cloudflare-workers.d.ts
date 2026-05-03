declare module "cloudflare:workers" {
  const env: Partial<CloudflareEnv>;
  export { env };
}
