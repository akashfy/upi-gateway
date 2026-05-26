import { NextResponse } from "next/server";
import { syncInbox } from "@/lib/inbox-sync";

// GET /api/sync-inbox — Fetch all PhonePe emails and sync to database
export async function GET() {
  try {
    console.log("🔄 Starting inbox sync...");
    const result = await syncInbox();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} new transactions from ${result.total} emails`,
      ...result,
    });
  } catch (error: any) {
    console.error("❌ Sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
