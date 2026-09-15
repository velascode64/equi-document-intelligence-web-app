import { NextResponse, type NextRequest } from "next/server"

import { requireUser } from "@/src/lib/supabase/server-client"
import { createBackendSupabaseClient } from "@/src/lib/supabase/backend-client"
import { jsonError } from "../../_utils"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireUser()
    const supabase = createBackendSupabaseClient()
    const url = new URL(request.url)

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id, name, status, raw_extraction")
      .eq("user_id", user.id)

    if (documentsError) throw new Error(documentsError.message)

    const documentById = new Map((documents ?? []).map((document: any) => [document.id, document]))
    const documentIds = Array.from(documentById.keys())

    if (!documentIds.length) return NextResponse.json({ performance: [] })

    let query = supabase
      .from("financial_performance")
      .select("*")
      .in("document_id", documentIds)
      .order("reporting_date", { ascending: false })

    const fund = url.searchParams.get("fund")
    const reportingDate = url.searchParams.get("reportingDate")
    if (fund) query = query.eq("fund", fund)
    if (reportingDate) query = query.eq("reporting_date", reportingDate)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    const rows = data?.length ? data : performanceFromRawExtraction(documents ?? [])

    return NextResponse.json({
      performance: rows.map((row: any) => ({
        id: row.id,
        documentId: row.document_id,
        documentName: documentById.get(row.document_id)?.name ?? "Unknown document",
        documentType: formatDocumentType(row.document_type),
        status: formatStatus(documentById.get(row.document_id)?.status),
        fund: row.fund ?? "",
        manager: row.manager ?? "",
        reportDate: row.reporting_date ?? "",
        strategy: row.strategy ?? "",
        aum: Number(row.aum ?? 0),
        navOrEndingBalance: Number(row.nav ?? row.ending_balance ?? 0),
        ytdReturn: Number(row.ytd_return ?? 0),
        sinceInception: Number(row.since_inception ?? 0),
        currency: "USD",
        benchmark: "N/A",
      })),
    })
  } catch (error) {
    return jsonError(error)
  }
}

function formatDocumentType(value: string | null) {
  if (value === "account_statement") return "Account Statement"
  if (value === "performance_report") return "Performance Report"
  return "Fund Factsheet"
}

function formatStatus(value: string | null | undefined) {
  if (value === "completed") return "processed"
  if (value === "failed") return "failed"
  return "processing"
}

function performanceFromRawExtraction(documents: any[]) {
  return documents.flatMap((document) =>
    (document.raw_extraction?.performance ?? []).map((row: any, index: number) => ({
      id: `${document.id}-${index}`,
      document_id: document.id,
      documents: document,
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
  )
}
