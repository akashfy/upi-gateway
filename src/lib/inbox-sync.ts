import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { saveTransaction } from "./db";

// Parse PhonePe email body and extract transaction data
function parsePhonePeEmail(subject: string, textBody: string, htmlBody: string) {
  // Use text body primarily, fallback to HTML stripped of tags
  const cleanHtml = htmlBody.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const body = textBody || cleanHtml;
  const fullContent = `${subject}\n${body}`;

  // Extract UTR / Transaction ID (T followed by 15-25 digits, or standalone 12-digit number)
  const utrRegex = /\bT\d{15,25}\b/gi;
  const utrMatches = fullContent.match(utrRegex);
  let utr = utrMatches ? utrMatches[0] : null;

  // Fallback: 12-digit UTR number
  if (!utr) {
    const fallbackRegex = /\b\d{12}\b/g;
    const fallbackMatches = fullContent.match(fallbackRegex);
    if (fallbackMatches) utr = fallbackMatches[0];
  }

  if (!utr) return null;

  // Extract Amount — Rs 99, Rs. 99, ₹99, INR 99
  const amountRegex = /(?:Rs\.?|INR|₹|rupees?)\s*(\d+(?:[,]\d+)*(?:\.\d{1,2})?)/i;
  const amountMatch = fullContent.match(amountRegex);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 0;

  // Extract from subject: "Received ₹ 99 from xyz@ybl"
  const subjectPaidByRegex = /from\s+([^\s]+)/i;
  const subjectPaidBy = subject.match(subjectPaidByRegex);

  // Extract Phone Last 4
  const phoneRegex = /(?:xxxxxx|\*{6})\s*(\d{4})/i;
  const phoneMatch = body.match(phoneRegex);
  let phoneLast4 = phoneMatch ? phoneMatch[1] : "";

  if (!phoneLast4) {
    const vpaRegex = /\b\d{6}(\d{4})@/i;
    const vpaMatch = body.match(vpaRegex);
    if (vpaMatch) phoneLast4 = vpaMatch[1];
  }

  // Extract Store Name from body (not headers)
  const storeRegex = /(?:Store\s*Name|Store)\s*[:\-]\s*([^\r\n<]+)/i;
  const storeMatch = body.match(storeRegex);
  const storeName = storeMatch
    ? storeMatch[1].split(/\t|\s{2,}/)[0].trim()
    : "Akash Digital Marketing";

  // Extract Paid By from body — careful not to match email From: header
  const paidByRegex = /(?:Paid\s*by|Paid\s*By)\s*[:\-]\s*([^\r\n<]+)/i;
  const paidByMatch = body.match(paidByRegex);
  let paidBy = paidByMatch
    ? paidByMatch[1].split(/\t|\s{2,}/)[0].trim()
    : (subjectPaidBy ? subjectPaidBy[1] : "Customer");

  // Clean up paidBy — remove any trailing HTML artifacts
  paidBy = paidBy.replace(/<[^>]*>/g, "").trim();
  if (!paidBy || paidBy.length < 2) paidBy = subjectPaidBy ? subjectPaidBy[1] : "Customer";

  // Extract Status
  const statusRegex = /(?:Txn\.?\s*[Ss]tatus|Status)\s*[:\-]\s*([^\r\n<]+)/i;
  const statusMatch = body.match(statusRegex);
  const status = statusMatch
    ? statusMatch[1].split(/\t|\s{2,}/)[0].trim()
    : "Successful";

  return { utr, amount, phoneLast4, storeName, paidBy, status };
}

// Sync inbox — fetch PhonePe payment emails from Gmail and save to DB
export async function syncInbox(): Promise<{ synced: number; total: number; errors: string[] }> {
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  const host = process.env.IMAP_HOST || "imap.gmail.com";
  const port = parseInt(process.env.IMAP_PORT || "993");

  if (!user || !pass) {
    return { synced: 0, total: 0, errors: ["IMAP_USER or IMAP_PASSWORD not set in .env"] };
  }

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  let synced = 0;
  let total = 0;
  const errors: string[] = [];

  try {
    await client.connect();
    console.log("📬 Connected to IMAP inbox:", user);

    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for PhonePe "Received" payment emails
      const searchResults = await client.search({
        subject: "Received",
      });

      total = searchResults.length;
      console.log(`📩 Found ${total} 'Received' emails`);

      for (const uid of searchResults) {
        try {
          const msg = await client.fetchOne(uid, { source: true });
          const rawSource = msg.source;

          if (!rawSource) continue;

          // Parse MIME email properly
          const parsed = await simpleParser(rawSource);

          const subject = parsed.subject || "";
          const textBody = parsed.text || "";
          const htmlBody = parsed.html || "";

          // Only process PhonePe-like payment emails
          if (!subject.toLowerCase().includes("received") || !subject.includes("₹")) {
            continue;
          }

          const txn = parsePhonePeEmail(subject, textBody, htmlBody);
          if (txn) {
            const isNew = saveTransaction(
              txn.utr,
              txn.amount,
              txn.phoneLast4,
              txn.storeName,
              txn.paidBy,
              txn.status
            );
            if (isNew) {
              synced++;
              console.log(`  ✅ ${txn.utr} — ₹${txn.amount} from ${txn.paidBy}`);
            }
          }
        } catch (e: any) {
          errors.push(`UID ${uid}: ${e.message}`);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (e: any) {
    console.error("❌ IMAP error:", e.message);
    errors.push(`IMAP: ${e.message}`);
  }

  console.log(`📬 Sync done: ${synced} new / ${total} checked`);
  return { synced, total, errors };
}
