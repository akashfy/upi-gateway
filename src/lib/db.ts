import fs from "fs";
import path from "path";

// Define the transaction structure
export interface Transaction {
  utr: string;
  amount: number;
  phoneLast4: string;
  timestamp: number;
  storeName?: string;
  paidBy?: string;
  status?: string;
  claimed?: boolean;
  customerName?: string;
  customerPhone?: string;
}

// Database file path
const DB_FILE = path.join(process.cwd(), "database.json");

// Helper to read database
export function readDb(): Transaction[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading database:", error);
    return [];
  }
}

// Helper to write database
export function writeDb(data: Transaction[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Helper to normalize UTR/Transaction ID for robust comparison
export function normalizeUtr(utr: string): string {
  return utr.toUpperCase().trim().replace(/^T/, "");
}

// Save a verified transaction (from email webhook — always unclaimed)
export function saveTransaction(
  utr: string, 
  amount: number, 
  phoneLast4: string,
  storeName?: string,
  paidBy?: string,
  status?: string
): boolean {
  const db = readDb();
  
  // Prevent duplicate UTRs
  if (db.some(t => normalizeUtr(t.utr) === normalizeUtr(utr))) {
    return false;
  }

  db.push({
    utr,
    amount,
    phoneLast4,
    timestamp: Date.now(),
    storeName: storeName || "Akash Digital Marketing",
    paidBy: paidBy || "",
    status: status || "Successful",
    claimed: false  // NEW: unclaimed until a user claims it
  });

  writeDb(db);
  return true;
}

// Find transaction by phone last 4 digits (legacy — still try)
export function findTransaction(phoneLast4: string, amount: number): Transaction | null {
  const db = readDb();
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  const match = db.find(t => 
    t.phoneLast4 === phoneLast4 && 
    !t.claimed &&
    t.timestamp >= fifteenMinutesAgo
  );
  return match || null;
}

// Find transaction by direct UTR (no amount check)
export function findTransactionByUtr(utr: string): Transaction | null {
  const db = readDb();
  const match = db.find(t => 
    normalizeUtr(t.utr) === normalizeUtr(utr)
  );
  return match || null;
}

// Smart search: match by UPI ID or phone number against paidBy & phoneLast4
// paidBy can be: "krishna.thakur@ptyes" (UPI VPA) or "******6494" (masked phone)
// phoneLast4 can be: "6494"
export function findTransactionByUpiId(input: string): Transaction | null {
  const db = readDb();
  const normalized = input.toLowerCase().trim();
  
  // Extract last 4 digits if input looks like a phone number
  const digits = input.replace(/\D/g, "");
  const last4 = digits.length >= 4 ? digits.slice(-4) : "";
  
  // Score each transaction — more matches = higher confidence
  const scored = db.map(t => {
    let score = 0;
    const paidBy = (t.paidBy || "").toLowerCase();
    
    // Exact UPI ID match in paidBy (e.g. "user@ybl")
    if (normalized.includes("@") && paidBy.includes(normalized)) score += 10;
    
    // paidBy contains the input string
    if (paidBy.includes(normalized)) score += 5;
    
    // Phone last4 match
    if (last4 && t.phoneLast4 === last4) score += 8;
    
    // paidBy contains the last4 digits (masked phone like ******6494)
    if (last4 && paidBy.includes(last4)) score += 6;
    
    return { transaction: t, score };
  });
  
  // Get best match with score > 0, newest first for tie-breaking
  const best = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || b.transaction.timestamp - a.transaction.timestamp);
  
  return best.length > 0 ? best[0].transaction : null;
}

// NEW: Find the latest UNCLAIMED transaction (for auto-detect)
// If any new payment came in that nobody has claimed yet, return it
export function findLatestUnclaimed(): Transaction | null {
  const db = readDb();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  
  // Find unclaimed transactions from the last 5 minutes, newest first
  const unclaimed = db
    .filter(t => !t.claimed && t.timestamp >= fiveMinutesAgo)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  return unclaimed.length > 0 ? unclaimed[0] : null;
}

// Mark a transaction as claimed + save customer info
export function claimTransaction(utr: string, customerName?: string, customerPhone?: string): boolean {
  const db = readDb();
  const index = db.findIndex(t => normalizeUtr(t.utr) === normalizeUtr(utr));
  
  if (index === -1) return false;
  
  db[index].claimed = true;
  if (customerName) db[index].customerName = customerName;
  if (customerPhone) db[index].customerPhone = customerPhone;
  writeDb(db);
  return true;
}
