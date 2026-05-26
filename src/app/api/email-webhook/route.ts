import { NextResponse } from "next/server";
import { saveTransaction } from "@/lib/db";

// POST endpoint for receiving email webhook parse requests
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const emailBody = payload.text || payload.html || payload.body || "";
    const subject = payload.subject || "";
    const fullContent = `${subject}\n${emailBody}`;

    console.log("📨 Received Email Webhook parsing request");

        // 1. Extract UTR (12-digit UPI reference number or PhonePe Transaction ID starting with optional T)
    // PhonePe Transaction IDs are usually T followed by 21 or 22 digits, sometimes only digits
    const utrRegex = /\b(?:T?\d{15,25}|\d{12})\b/gi;
    const utrMatches = fullContent.match(utrRegex);
    const utr = utrMatches ? utrMatches[0] : null;

    // 2. Extract Amount
    // Matches: Rs 299, Rs. 299, INR 299, ₹ 299, ₹299.00, Rs 299.00 etc.
    const amountRegex = /(?:Rs\.?|INR|₹|rupees?)\s*(\d+(?:\.\d{2})?)/i;
    const amountMatch = fullContent.match(amountRegex);
    let amount = amountMatch ? parseFloat(amountMatch[1]) : 299; // Default fallback to 299 if not found

    // 3. Extract Sender's Phone Number Last 4 digits (if available)
    // UPI emails often contain sender details like: "Rohan (xxxxxx3210@ybl)" or "A/c XXXXXX3210"
    const phoneRegex = /(?:xxxxxx|\*{6})\s*(\d{4})/i;
    let phoneMatch = fullContent.match(phoneRegex);
    let phoneLast4 = phoneMatch ? phoneMatch[1] : null;

    // Additional backup phone regex: check for ending numbers in VPA like xxxxxx1234@
    if (!phoneLast4) {
      const vpaRegex = /\b\d{6}(\d{4})@/i;
      const vpaMatch = fullContent.match(vpaRegex);
      if (vpaMatch) {
        phoneLast4 = vpaMatch[1];
      }
    }

    // Direct search for "last 4 digits" patterns in email body
    if (!phoneLast4) {
      const backupRegex = /(?:phone|mobile|VPA|sender).{0,15}\b\d*(\d{4})\b/i;
      const backupMatch = fullContent.match(backupRegex);
      if (backupMatch) {
        phoneLast4 = backupMatch[1];
      }
    }

    // PhonePe Business notifications do not contain phone numbers.
    // UTR / Transaction ID is the absolute minimum required.
    if (!utr) {
      return NextResponse.json({
        success: false,
        message: "Failed to parse key transaction components (Missing UTR / Transaction ID)",
        parsed: { utr, amount, phoneLast4 }
      }, { status: 400 });
    }

    // 4. Extract Store Name
    const storeNameRegex = /(?:Store Name|Store)\s*:\s*[\r\n\t]*([^\r\n]+)/i;
    const storeNameMatch = fullContent.match(storeNameRegex);
    const storeName = storeNameMatch 
      ? storeNameMatch[1].split(/\t|\s{2,}/)[0].trim() 
      : "Akash Digital Marketing";

    // 5. Extract Payer Details (Paid By / Paid by)
    const paidByRegex = /(?:Paid by|Paid By|Sender|From)\s*:\s*[\r\n\t]*([^\r\n]+)/i;
    const paidByMatch = fullContent.match(paidByRegex);
    const paidBy = paidByMatch 
      ? paidByMatch[1].split(/\t|\s{2,}/)[0].trim() 
      : "Customer";

    // 6. Extract Transaction Status (Txn. Status / Txn. status)
    const statusRegex = /(?:Txn\.\s*status|Txn\.\s*Status|Status)\s*:\s*[\r\n\t]*([^\r\n]+)/i;
    const statusMatch = fullContent.match(statusRegex);
    const txnStatus = statusMatch 
      ? statusMatch[1].split(/\t|\s{2,}/)[0].trim() 
      : "Successful";

    // Save transaction to local JSON DB (defaulting to empty string if phone last4 is not parsed)
    const normalizedPhoneLast4 = phoneLast4 || "";
    const isNew = saveTransaction(utr, amount, normalizedPhoneLast4, storeName, paidBy, txnStatus);

    return NextResponse.json({
      success: true,
      message: isNew ? "Transaction parsed and saved! ✅" : "Transaction already logged",
      data: { 
        utr, 
        amount, 
        phoneLast4: normalizedPhoneLast4,
        storeName,
        paidBy,
        status: txnStatus
      }
    });

  } catch (error: any) {
    console.error("Error processing email webhook:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}
