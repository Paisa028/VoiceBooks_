const { z } = require('zod');
const text = (max) => z.string().trim().max(max);
const optionalText = (max) => text(max).nullable().optional();
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.union([z.number(), z.string().trim().min(1)])
    .transform(Number).refine(value => Number.isFinite(value) && value > 0 && value <= 1e12, 'Enter a positive amount')
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.01, 'Use at most two decimal places'),
  description: text(500).min(1),
  paymentMethod: text(50).min(1),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid date'),
  party: optionalText(200), partyType: optionalText(50), accountCategory: optionalText(200),
  reference: optionalText(200), notes: optionalText(1000), originalTranscript: optionalText(5000),
  vatApplicable: z.boolean().optional().default(false),
  vatInclusive: z.boolean().nullable().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  vatAmount: z.union([z.number().nonnegative().max(1e12), z.literal('')]).nullable().optional(),
  attachment: z.object({ name: text(255), size: z.number().nonnegative(), type: text(100) }).nullable().optional(),
});
const transcriptSchema = z.object({ transcript: text(5000).min(1) });
const assignmentSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254).or(z.literal('')) });
module.exports = { transactionSchema, transcriptSchema, assignmentSchema };
