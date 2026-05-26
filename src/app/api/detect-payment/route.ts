import { NextResponse } from "next/server";
import { findTransactionByUtr, findTransactionByUpiId, findLatestUnclaimed, findTransaction, claimTransaction } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || "";
    const utr = searchParams.get("utr") || "";
    const upiId = searchParams.get("upiId") || "";
    const customerName = searchParams.get("customerName") || "";
    const customerPhone = searchParams.get("customerPhone") || "";

    // 1. Direct UTR / Transaction ID lookup (Priority — manual verify)
    if (utr) {
      console.log(`🔎 UTR lookup: ${utr}`);
      const match = findTransactionByUtr(utr);

      if (match) {
        // Claim it + save customer info
        claimTransaction(match.utr, customerName, customerPhone);
        
        return NextResponse.json({
          verified: true,
          message: "Payment successfully verified! ✅",
          utr: match.utr,
          amount: match.amount,
          storeName: match.storeName || "Akash Digital Marketing",
          paidBy: match.paidBy || "Customer",
          status: match.status || "Successful"
        });
      }

      return NextResponse.json({
        verified: false,
        message: "Transaction ID / UTR not found. Please check and try again."
      });
    }

    // 2. UPI ID lookup
    if (upiId) {
      console.log(`🔎 UPI ID lookup: ${upiId}`);
      const match = findTransactionByUpiId(upiId);

      if (match) {
        claimTransaction(match.utr, customerName, customerPhone);
        return NextResponse.json({
          verified: true,
          message: "Payment verified via UPI ID! ✅",
          utr: match.utr,
          amount: match.amount,
          storeName: match.storeName || "Akash Digital Marketing",
          paidBy: match.paidBy || "Customer",
          status: match.status || "Successful"
        });
      }

      return NextResponse.json({
        verified: false,
        message: "No payment found for this UPI ID. Please check and try again."
      });
    }

    // 2. Auto-detect: Try phone last4 match first
    if (phone && phone.length >= 4) {
      const phoneLast4 = phone.slice(-4);
      console.log(`🔎 Auto-detect: phone last4=${phoneLast4}`);
      
      const phoneMatch = findTransaction(phoneLast4, 0);
      if (phoneMatch) {
        claimTransaction(phoneMatch.utr);
        return NextResponse.json({
          verified: true,
          message: "Payment auto-detected via phone! ✅",
          utr: phoneMatch.utr,
          amount: phoneMatch.amount,
          storeName: phoneMatch.storeName || "Akash Digital Marketing",
          paidBy: phoneMatch.paidBy || "Customer",
          status: phoneMatch.status || "Successful"
        });
      }
    }

    // 3. Auto-detect fallback: Find ANY latest unclaimed transaction
    // This works because PhonePe emails don't contain phone numbers
    // So we match the latest unclaimed payment to the currently waiting user
    const unclaimed = findLatestUnclaimed();
    if (unclaimed) {
      console.log(`✅ Auto-detect: Found unclaimed transaction ${unclaimed.utr}`);
      claimTransaction(unclaimed.utr);
      
      return NextResponse.json({
        verified: true,
        message: "Payment auto-detected! ✅",
        utr: unclaimed.utr,
        amount: unclaimed.amount,
        storeName: unclaimed.storeName || "Akash Digital Marketing",
        paidBy: unclaimed.paidBy || "Customer",
        status: unclaimed.status || "Successful"
      });
    }

    return NextResponse.json({
      verified: false,
      message: "Payment not detected yet. Waiting for bank notification..."
    });

  } catch (error: any) {
    console.error("Error checking payment:", error);
    return NextResponse.json({
      verified: false,
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}
