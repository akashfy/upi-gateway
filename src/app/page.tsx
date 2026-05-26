"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import confetti from "canvas-confetti";
import { ShieldCheck, Lock, Building2, ArrowRight, ArrowLeft, Clock, CircleCheck, Info, Receipt, AtSign, CloudDownload, TriangleAlert } from "lucide-react";
import trxGuide from "@/assets/trx.png";

const pageTransition = {
  initial: { opacity: 0, y: 40, scale: 0.95, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.96,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: [0.55, 0.06, 0.68, 0.19] },
  },
};

const fadeSlide = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const [step, setStep] = useState<"phone" | "qr" | "success">("phone");
  const [showUtr, setShowUtr] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [utr, setUtr] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [utrError, setUtrError] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [verifyMode, setVerifyMode] = useState<"trxId" | "upiId">("trxId");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 min timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Kodelyx Lab";
  const BUSINESS_LOGO = process.env.NEXT_PUBLIC_BUSINESS_LOGO || "kX";
  const QR_URL = process.env.NEXT_PUBLIC_QR_IMAGE_URL || "/qr.png";
  const ACCESS_FILE_URL = process.env.NEXT_PUBLIC_ACCESS_FILE_URL || "#";

  const goToQr = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("qr");
    setShowUtr(false);
    setTimeLeft(300);
  };

  // Auto-sync inbox on load — fetch all PhonePe emails
  useEffect(() => {
    fetch("/api/sync-inbox").catch(() => {});
  }, []);

  // Countdown timer when QR is shown
  useEffect(() => {
    if (step === "qr" && !showUtr) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, showUtr]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const verifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || utr.length < 8) { toast.error("Enter a valid Transaction ID."); return; }
    setIsChecking(true);
    setUtrError("");
    try {
      const res = await fetch(`/api/detect-payment?utr=${utr}&amount=1&customerName=${encodeURIComponent(name)}&customerPhone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.verified) {
        setPaymentDetails(data);
        setStep("success");
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success("Payment verified! 🎉");
      } else { setUtrError(data.message || "Not found. Check and try again."); }
    } catch { toast.error("Server error. Try again."); }
    finally { setIsChecking(false); }
  };

  const verifyUpiId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiIdInput || upiIdInput.length < 4) { toast.error("Enter a valid UPI ID."); return; }
    setIsChecking(true);
    setUtrError("");
    try {
      const res = await fetch(`/api/detect-payment?upiId=${encodeURIComponent(upiIdInput)}&customerName=${encodeURIComponent(name)}&customerPhone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.verified) {
        setPaymentDetails(data);
        setStep("success");
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        toast.success("Payment verified! 🎉");
      } else { setUtrError(data.message || "No payment found for this UPI ID."); }
    } catch { toast.error("Server error. Try again."); }
    finally { setIsChecking(false); }
  };

  return (
    <main className="page">
      <Toaster richColors position="top-center" />
      <div className="wrap">
        <motion.div
          className="card"
          layout
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1, layout: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
        >
          {/* BRAND HEADER */}
          <div className="card-top">
            <div className="brand">
              <motion.div className="logo" whileHover={{ scale: 1.08, rotate: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                {BUSINESS_LOGO}
              </motion.div>
              <div>
                <div className="brand-name">{BUSINESS_NAME}</div>
                <div className="verified"><i className="fa-solid fa-circle-check"></i> Trusted Business</div>
              </div>
            </div>
            {step === "qr" && (
              <motion.button className="back-btn" onClick={() => setStep("phone")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ArrowLeft size={16} />
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">

            {/* STEP 1: CHECKOUT */}
            {step === "phone" && (
              <motion.form key="phone" onSubmit={goToQr} className="body checkout-body" {...pageTransition}>
                <motion.div className="checkout-header" variants={fadeUp}>
                  <h2 className="checkout-title">Secure Checkout</h2>
                  <span className="checkout-badge"><Lock size={12} /> SSL</span>
                </motion.div>

                <motion.div className="field-group" variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.05 }}>
                  <label className="field-label">Name <span className="optional">Optional</span></label>
                  <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="name-input" />
                </motion.div>

                <motion.div className="field-group" variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
                  <label className="field-label">Mobile <span className="optional">Optional</span></label>
                  <div className="phone-box">
                    <span className="flag">🇮🇳 +91</span>
                    <input type="tel" maxLength={10} placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="phone-input" />
                  </div>
                </motion.div>

                <motion.button type="submit" className="btn-pay" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                  Pay Now <ArrowRight size={16} />
                  <span className="btn-shimmer"></span>
                </motion.button>

                <div className="trust-row">
                  {["NPCI Verified", "UPI Secure", "256-bit SSL"].map((t, i) => (
                    <motion.div key={t} className="trust-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                      {i === 0 ? <ShieldCheck size={13} /> : i === 1 ? <Building2 size={13} /> : <Lock size={13} />}
                      <span>{t}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.form>
            )}

            {/* STEP 2: QR + VERIFY */}
            {step === "qr" && (
              <motion.div key="qr" className="body qr-body" {...pageTransition}>
                <AnimatePresence mode="wait">

                  {/* QR with Timer */}
                  {!showUtr ? (
                    <motion.div key="qr-scan" className="qr-inner" {...fadeSlide}>

                      {/* Countdown Timer */}
                      <div className={`qr-timer ${timeLeft <= 60 ? "urgent" : ""}`}>
                        <Clock size={13} />
                        <span>QR expires in <strong>{formatTime(timeLeft)}</strong></span>
                      </div>

                      <motion.div
                        className="qr-frame"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      >
                        <img src={QR_URL} alt="UPI QR" className="qr-img" />
                      </motion.div>

                      <p className="scan-text">Scan with any UPI app & pay</p>

                      <motion.div className="upi-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        {[
                          <svg key="gpay" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M48 24c0-1.71-.15-3.37-.45-4.98H24v9.51h13.51c-.58 3.15-2.36 5.82-5.02 7.61v6.33h8.11c4.74-4.36 7.4-10.78 7.4-18.47z"/><path fill="#34A853" d="M36.6 36.14c-3.41 2.29-7.81 3.66-12.6 3.66-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48c6.48 0 11.93-2.13 15.89-5.81l-8.11-6.33z"/><path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z"/></svg>,
                          <svg key="phonepe" viewBox="0 0 24 24"><path fill="#5F259F" d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743V9.941zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243 1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433zm-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"/></svg>,
                          <svg key="paytm" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#00BAF2"/><text x="32" y="40" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="Arial,sans-serif">Paytm</text></svg>,
                        ].map((svg, i) => (
                          <motion.div key={i} className="upi-app" whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}>
                            {svg}
                          </motion.div>
                        ))}
                      </motion.div>

                      <motion.button
                        className="btn-verify"
                        onClick={() => setShowUtr(true)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <CircleCheck size={17} />
                        I have paid · Verify
                      </motion.button>

                      <div className="hint">
                        <Lock size={12} />
                        256-bit SSL · NPCI UPI Verified
                      </div>
                    </motion.div>
                  ) : (
                    /* UTR / UPI ID Entry */
                    <motion.div key="utr" className="utr-step" {...fadeSlide}>
                      <div className="verify-tabs">
                        {(["trxId", "upiId"] as const).map((mode) => (
                          <motion.button
                            key={mode}
                            className={`verify-tab ${verifyMode === mode ? "active" : ""}`}
                            onClick={() => { setVerifyMode(mode); setUtrError(""); }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {mode === "trxId" ? <Receipt size={14} /> : <AtSign size={14} />}
                            {mode === "trxId" ? "Transaction ID" : "UPI ID"}
                          </motion.button>
                        ))}
                      </div>

                      <AnimatePresence mode="wait">
                        {verifyMode === "trxId" ? (
                          <motion.div key="trx-guide" className="txn-guide" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <p className="guide-label">
                              <Info size={14} />
                              Where to find Transaction ID?
                            </p>
                            <img src={trxGuide.src} alt="How to find Transaction ID" className="guide-img" />
                          </motion.div>
                        ) : (
                          <motion.p key="upi-guide" className="utr-step-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            Enter the UPI ID you paid from (e.g. name@ybl)
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <form onSubmit={verifyMode === "trxId" ? verifyUtr : verifyUpiId} className="utr-main">
                        <AnimatePresence mode="wait">
                          {verifyMode === "trxId" ? (
                            <motion.input key="trx" type="text" maxLength={24} placeholder="e.g. T2605051004074731764696" className="utr-input" value={utr} autoFocus
                              onChange={(e) => { setUtr(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setUtrError(""); }}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} />
                          ) : (
                            <motion.input key="upi" type="text" maxLength={40} placeholder="e.g. yourname@ybl" className="utr-input" value={upiIdInput} autoFocus
                              onChange={(e) => { setUpiIdInput(e.target.value.toLowerCase().trim()); setUtrError(""); }}
                              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} />
                          )}
                        </AnimatePresence>

                        <motion.button type="submit" className="utr-verify-btn"
                          disabled={isChecking || (verifyMode === "trxId" ? utr.length < 8 : upiIdInput.length < 4)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                          {isChecking ? <span className="spinner"></span> : <><CircleCheck size={16} /> Verify Payment</>}
                        </motion.button>

                        <AnimatePresence>
                          {utrError && (
                            <motion.p className="utr-err" initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }}>
                              <TriangleAlert size={13} /> {utrError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </form>

                      <motion.button className="back-to-qr" onClick={() => setShowUtr(false)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <ArrowLeft size={14} /> Back to QR
                      </motion.button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === "success" && (
              <motion.div key="success" className="body success-body" {...pageTransition}>
                <motion.div className="check-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
                  </svg>
                  <div className="check-ring"></div>
                </motion.div>

                <motion.h2 className="success-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  Payment Verified!
                </motion.h2>

                <motion.p className="success-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                  ₹{(paymentDetails?.amount || 0).toLocaleString("en-IN")}.00 received
                </motion.p>

                <motion.div className="receipt" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <div className="r-row"><span>Transaction ID</span><strong>{paymentDetails?.utr || utr}</strong></div>
                  {paymentDetails?.paidBy && <div className="r-row"><span>Paid By</span><strong>{paymentDetails.paidBy}</strong></div>}
                  <div className="r-row"><span>Status</span><strong className="green">{paymentDetails?.status || "Successful"}</strong></div>
                </motion.div>

                <motion.a href={ACCESS_FILE_URL} target="_blank" className="dl-btn"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <CloudDownload size={18} /> Access File
                </motion.a>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
