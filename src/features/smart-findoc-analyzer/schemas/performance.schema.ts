import { z } from "zod"

export type Fund = {
  id: string
  name: string
  manager: string
  currency: string
}

export type PerformanceRecord = {
  id: string
  documentId: string
  fundId: string
  reportingDate: string
  monthlyReturn?: number
  ytdReturn?: number
  sinceInception?: number
  nav?: number
  benchmark?: string
  currency: string
}

export const performanceRecordSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  fundId: z.string().min(1),
  reportingDate: z.string().date(),
  monthlyReturn: z.number().finite().min(-1).max(10).optional(),
  ytdReturn: z.number().finite().min(-1).max(10).optional(),
  sinceInception: z.number().finite().min(-1).max(10).optional(),
  nav: z.number().finite().nonnegative().optional(),
  benchmark: z.string().min(1).optional(),
  currency: z.string().length(3),
})
