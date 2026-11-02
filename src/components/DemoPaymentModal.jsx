/**
 * DemoPaymentModal
 * A Razorpay-style demo payment modal shown when no live Razorpay keys are
 * configured (demo_mode === true from the backend).
 *
 * Props:
 *   order        – PaymentOrderOut  { booking_id, amount_inr, razorpay_order_id, hold_expires_at }
 *   hall         – { name, block }
 *   slot         – { label, start_time, end_time }
 *   bookingDate  – "YYYY-MM-DD"
 *   user         – { name, email, mobile }
 *   onSuccess    – () => void   called after demo confirm succeeds
 *   onCancel     – () => void   called when user dismisses / cancels
 */

import { useEffect, useState } from "react";
import api from "../api";

const METHODS = [
  { id: "card", label: "Card", icon: "💳" },
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "nb", label: "Net Banking", icon: "🏦" },
  { id: "wallet", label: "Wallet", icon: "👛" },
];

// Fake test-card rows for display
const TEST_CARDS = [
  { number: "4111 1111 1111 1111", network: "Visa", status: "Success" },
  { number: "5267 3181 8797 5449", network: "Mastercard", status: "Success" },
  { number: "4000 0000 0000 0002", network: "Visa", status: "Failure (demo)" },
];

function Countdown({ expiresAt }) {
  const calc = () =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <span className={secs < 60 ? "text-rose-400" : "text-amber-300"}>
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function DemoPaymentModal({
  order,
  hall,
  slot,
  bookingDate,
  user,
  onSuccess,
  onCancel,
}) {
  const [method, setMethod] = useState("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Simulated UPI ID input state
  const [upiId, setUpiId] = useState("");
  // Simulated card state
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });

  const formatted = new Date(bookingDate + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  const handlePay = async () => {
    setError("");
    setBusy(true);
    try {
      // Small artificial delay to simulate network
      await new Promise((r) => setTimeout(r, 900));
      await api.post("/bookings/verify", {
        booking_id: order.booking_id,
        demo_confirm: true,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.delete(`/bookings/${order.booking_id}/hold`);
    } catch {
      // silent – hold will expire on its own
    }
    onCancel();
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      {/* Modal shell */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "#0f1923" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Demo checkout header ── */}
        <div className="flex items-center justify-between bg-[#072635] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3395FF]">
              <span className="text-sm font-bold text-white">N</span>
            </div>
            <div>
              <p className="text-xs text-white/50">NLC interactive demo</p>
              <p className="text-sm font-semibold text-white">NLC Community Hall</p>
            </div>
          </div>
          {/* Hold timer */}
          {order.hold_expires_at && (
            <div className="text-right">
              <p className="text-xs text-white/40">Slot held for</p>
              <p className="text-sm font-mono font-semibold">
                <Countdown expiresAt={order.hold_expires_at} />
              </p>
            </div>
          )}
        </div>

        {/* ── Demo mode banner ── */}
        <div className="flex items-center gap-2 bg-amber-500/15 px-5 py-2 text-xs text-amber-300">
          <span>⚠️</span>
          <span>
            <strong>Simulated checkout</strong> — This demo does not connect to a payment provider.
          </span>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left panel: order summary */}
          <div className="shrink-0 bg-[#072635]/60 px-5 py-5 md:w-52">
            <p className="text-xs uppercase tracking-widest text-[#3395FF]">
              {hall.block}
            </p>
            <p className="mt-0.5 font-semibold text-white">{hall.name}</p>
            <p className="mt-3 text-xs text-white/50">Date</p>
            <p className="text-sm text-white">{formatted}</p>
            <p className="mt-2 text-xs text-white/50">Time</p>
            <p className="text-sm text-white">
              {slot.label}
              <br />
              <span className="text-xs text-white/60">
                {slot.start_time}–{slot.end_time}
              </span>
            </p>

            {/* Breakdown */}
            <div className="mt-3 space-y-1">
              <p className="text-xs text-white/50">Booking fee</p>
              <p className="text-sm text-white">
                ₹{Number(order.amount_inr).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-white/50 mt-1">
                Refundable advance
              </p>
              <p className="text-sm text-emerald-400">
                ₹{Number(order.refundable_advance).toLocaleString("en-IN")}
              </p>
              <div className="border-t border-white/15 pt-2 mt-1">
                <p className="text-xs text-white/50">Total to pay</p>
                <p className="text-2xl font-bold text-[#3395FF]">
                  ₹{Number(order.total_amount_inr).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* ── Right panel: payment methods ── */}
          <div className="flex-1 px-5 py-5 space-y-4">
            {/* Method tabs */}
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${method === m.id
                    ? "bg-[#3395FF] text-white"
                    : "text-white/50 hover:text-white"
                    }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* ── Card inputs ── */}
            {method === "card" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">Test cards (any CVV / expiry)</p>
                <div className="rounded-md bg-white/5 p-3 space-y-1">
                  {TEST_CARDS.map((tc) => (
                    <button
                      key={tc.number}
                      className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10 transition-colors"
                      onClick={() =>
                        setCard((prev) => ({
                          ...prev,
                          number: tc.number,
                          expiry: "12/28",
                          cvv: "123",
                          name: user.name,
                        }))
                      }
                    >
                      <span className="font-mono text-white/80">{tc.number}</span>
                      <span className="ml-2 text-white/40">{tc.network}</span>
                      <span
                        className={`ml-2 ${tc.status.startsWith("Failure")
                          ? "text-rose-400"
                          : "text-emerald-400"
                          }`}
                      >
                        {tc.status}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#3395FF]"
                  placeholder="Card number"
                  maxLength={19}
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#3395FF]"
                    placeholder="MM / YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                  />
                  <input
                    className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#3395FF]"
                    placeholder="CVV"
                    maxLength={4}
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                  />
                </div>
                <input
                  className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#3395FF]"
                  placeholder="Name on card"
                  value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value })}
                />
              </div>
            )}

            {/* ── UPI ── */}
            {method === "upi" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">
                  Enter any UPI ID (demo — not validated)
                </p>
                <input
                  className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#3395FF]"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                  {["@okaxis", "@ybl", "@paytm", "@okicici"].map((suffix) => (
                    <button
                      key={suffix}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 hover:border-[#3395FF] hover:text-white transition-colors"
                      onClick={() => setUpiId((prev) => prev.split("@")[0] + suffix)}
                    >
                      {suffix}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Net Banking ── */}
            {method === "nb" && (
              <div className="space-y-2">
                <p className="text-xs text-white/40">Select your bank (demo)</p>
                <div className="grid grid-cols-2 gap-2">
                  {["SBI", "HDFC", "ICICI", "Axis", "Canara", "Indian Bank"].map(
                    (bank) => (
                      <button
                        key={bank}
                        className="rounded-md border border-white/10 bg-white/5 py-2 text-sm text-white/70 hover:border-[#3395FF] hover:text-white transition-colors"
                      >
                        {bank}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ── Wallet ── */}
            {method === "wallet" && (
              <div className="space-y-2">
                <p className="text-xs text-white/40">Select wallet (demo)</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Paytm", "PhonePe", "Amazon Pay", "Mobikwik"].map((w) => (
                    <button
                      key={w}
                      className="rounded-md border border-white/10 bg-white/5 py-2 text-sm text-white/70 hover:border-[#3395FF] hover:text-white transition-colors"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="rounded-md bg-rose-500/20 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            {/* Pay / Cancel */}
            <button
              onClick={handlePay}
              disabled={busy}
              className="w-full rounded-md bg-[#3395FF] py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing payment…
                </span>
              ) : (
                `Pay ₹${Number(order.total_amount_inr).toLocaleString("en-IN")}`
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={busy}
              className="w-full rounded-md border border-white/10 py-2 text-sm text-white/50 hover:text-white hover:border-white/30 transition-colors"
            >
              Cancel &amp; release slot
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-3 text-center text-xs text-white/30">
          Demo checkout &nbsp;·&nbsp; No real transactions
        </div>
      </div>
    </div>
  );
}
