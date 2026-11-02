import * as z from 'zod';

export const bookingSchema = z
  .object({
    topic: z.string().trim().min(1, 'Topik meeting wajib diisi'),
    is_recurring: z.boolean(),
    recurrence_type: z.coerce.number().optional(),
    repeat_interval: z.coerce.number().optional(),
    weekly_days: z.string().optional(),
    end_date_time: z.string().optional(),
    ignore_conflict: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring) {
      if (!data.end_date_time || !data.end_date_time.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tanggal selesai berulang wajib diisi',
          path: ['end_date_time'],
        });
      }
      if (data.recurrence_type === 2 && (!data.weekly_days || !data.weekly_days.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pilih minimal 1 hari pengulangan',
          path: ['weekly_days'],
        });
      }
    }
  });
