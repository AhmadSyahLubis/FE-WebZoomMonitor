import { v4 as uuidv4 } from 'uuid';

export function getWebDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `web-admin-${uuidv4()}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

export const WEB_DEVICE_NAME = 'Web Admin Dashboard';
