import { NextResponse } from "next/server"

import { requireUser } from "@/src/lib/supabase/server-client"
import { jsonError } from "../../_utils"

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ documents: data ?? [] })
  } catch (error) {
    return jsonError(error)
  }
}
