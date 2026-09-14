import { z } from "zod"

const percentage = z.number().finite().min(-1).max(10).optional()

export const extractedFinancialDataSchema = z.object({
  documentType: z.enum(["fund_factsheet", "account_statement", "performance_report"]),
  fund: z.object({
    name: z.string().trim().min(1),
    manager: z.string().trim().min(1),
    currency: z.string().trim().length(3),
  }),
  strategy: z.string().trim().min(1).optional(),
  aum: z.number().finite().nonnegative().optional(),
  performance: z.array(z.object({
    reportingDate: z.string().date(),
    monthlyReturn: percentage,
    ytdReturn: percentage,
    sinceInception: percentage,
    nav: z.number().finite().nonnegative().optional(),
    benchmark: z.string().trim().min(1).optional(),
  })).min(1),
})

export type ExtractedFinancialDataInput = z.input<typeof extractedFinancialDataSchema>
