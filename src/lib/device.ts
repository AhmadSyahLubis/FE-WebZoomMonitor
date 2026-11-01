import { v4 as uuidv4 } from 'uuid';

const DEVICE_STORAGE_KEY = 'zm_web_device_id';

function loadOrCreateDeviceId(): string {
  try {
    const existing = globalThis.sessionStorage?.getItem(DEVICE_STORAGE_KEY);
    if (existing && existing.startsWith('web-')) return existing;
    const created = `web-${uuidv4()}`;
    globalThis.sessionStorage?.setItem(DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    return `web-${uuidv4()}`;
  }
}

// Independent tabs keep their own sessionStorage device_id across page reloads.
const deviceId = loadOrCreateDeviceId();
export function getWebDeviceId(): string { return deviceId; }

export const WEB_DEVICE_NAME = 'Web Admin Dashboard';
