import { v4 as uuidv4 } from 'uuid';

// Independent tabs must not rotate the same backend device session.
const deviceId = `web-${uuidv4()}`;
export function getWebDeviceId(): string { return deviceId; }

export const WEB_DEVICE_NAME = 'Web Admin Dashboard';
