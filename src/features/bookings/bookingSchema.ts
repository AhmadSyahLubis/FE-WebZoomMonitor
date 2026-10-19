import * as z from 'zod';

export const bookingSchema = z.object({
  topic: z.string().trim().min(1, 'Topik meeting wajib diisi'),
  is_recurring: z.boolean(),
  recurrence_type: z.coerce.number().optional(),
  repeat_interval: z.coerce.number().optional(),
  weekly_days: z.string().optional(),
  end_date_time: z.string().optional(),
  ignore_conflict: z.boolean(),
});
