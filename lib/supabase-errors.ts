// Only use legacy table access when PostgREST cannot resolve the RPC.
// Permission, validation and availability failures must not trigger a fallback.
export function isMissingRpc(error: { code?: string } | null) {
  return error?.code === "PGRST202";
}
