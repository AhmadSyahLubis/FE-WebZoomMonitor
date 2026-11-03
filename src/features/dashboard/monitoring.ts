// Use elapsed time since receipt so a device clock offset cannot age Zoom data incorrectly.
export function monitoringIsStale(observedAt: string | undefined, serverTime: string | undefined, receivedAt: number, now = Date.now()): boolean {
  const observed = Date.parse(observedAt || '');
  const server = Date.parse(serverTime || '');
  if (!Number.isFinite(observed) || !Number.isFinite(server) || !receivedAt || observed > server) return true;
  return server - observed + Math.max(0, now - receivedAt) >= 90_000;
}
