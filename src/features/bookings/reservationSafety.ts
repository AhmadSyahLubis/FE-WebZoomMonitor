import type { AvailabilityResult } from '@/types/api';

export function needsReservationConfirmation(room: AvailabilityResult | null): boolean {
  if (!room) return false;
  return room.requires_reservation_confirmation === true || [room.conflicting_meeting, room.scheduled_now].some(meeting => meeting?.monitoring?.labels.some(label => label.code === 'ended_reserved' || label.code === 'previously_live_reserved'));
}

export function reservationOverrideAllowed(room: AvailabilityResult | null, force: boolean, confirmed: boolean): boolean {
  return !force || !needsReservationConfirmation(room) || confirmed;
}
