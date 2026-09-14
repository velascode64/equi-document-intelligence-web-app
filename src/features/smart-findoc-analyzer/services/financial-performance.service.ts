import type { DocumentPerformanceRow } from "../actions/financial-performance.parser"

type SupabaseQueryClient = {
  from(table: string): any
}

export type FinancialPerformance = {
  id: string
  document_id: string
  fund: string | null
  manager: string | null
  document_type: "fund_factsheet" | "account_statement" | "performance_report" | null
  reporting_date: string | null
  strategy: string | null
  aum: number | null
  nav: number | null
  ending_balance: number | null
  ytd_return: number | null
  since_inception: number | null
  created_at: string
}

export type CreateFinancialPerformanceInput = Omit<FinancialPerformance, "id" | "created_at">

export async function listFinancialPerformanceByDocument(
  supabase: SupabaseQueryClient,
  documentId: string
): Promise<FinancialPerformance[]> {
  const { data, error } = await supabase
    .from("financial_performance")
    .select("*")
    .eq("document_id", documentId)
    .order("reporting_date", { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listFinancialPerformance(
  supabase: SupabaseQueryClient,
  filters: { fund?: string; reportingDate?: string } = {}
): Promise<FinancialPerformance[]> {
  let query = supabase
    .from("financial_performance")
    .select("*")
    .order("reporting_date", { ascending: false })

  if (filters.fund) query = query.eq("fund", filters.fund)
  if (filters.reportingDate) query = query.eq("reporting_date", filters.reportingDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createFinancialPerformanceRows(
  supabase: SupabaseQueryClient,
  rows: CreateFinancialPerformanceInput[]
): Promise<FinancialPerformance[]> {
  if (!rows.length) return []

  const { data, error } = await supabase
    .from("financial_performance")
    .insert(rows)
    .select("*")

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function replaceFinancialPerformanceForDocument(
  supabase: SupabaseQueryClient,
  documentId: string,
  rows: CreateFinancialPerformanceInput[]
): Promise<FinancialPerformance[]> {
  const { error: deleteError } = await supabase
    .from("financial_performance")
    .delete()
    .eq("document_id", documentId)

  if (deleteError) throw new Error(deleteError.message)
  return createFinancialPerformanceRows(supabase, rows)
}

export async function deleteFinancialPerformanceForDocument(
  supabase: SupabaseQueryClient,
  documentId: string
): Promise<void> {
  const { error } = await supabase
    .from("financial_performance")
    .delete()
    .eq("document_id", documentId)

  if (error) throw new Error(error.message)
}

export function toFinancialPerformanceRows(
  documentId: string,
  rows: DocumentPerformanceRow[]
): CreateFinancialPerformanceInput[] {
  return rows.map((row) => ({
    document_id: documentId,
    fund: row.fund,
    manager: row.manager,
    document_type: row.documentType,
    reporting_date: row.reportingDate,
    strategy: row.strategy,
    aum: row.aum,
    nav: row.nav,
    ending_balance: row.endingBalance,
    ytd_return: row.ytdReturn,
    since_inception: row.sinceInception,
  }))
}
