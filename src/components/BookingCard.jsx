/**
 * BookingCard
 *
 * Props:
 *   booking   – BookingOut from API
 *   actions   – [{ label, onClick, variant }]  admin override buttons
 *   compact   – bool   smaller layout for admin list
 *   onCancel  – async (id) => void   shows inline cancel confirmation
 */

import { useState } from "react";

// ── status badge config ───────────────────────────────────────────────────────
const STATUS_CFG = {
    confirmed: { label: "Confirmed", bg: "bg-emerald-600/25", text: "text-emerald-300", border: "border-emerald-500/40" },
    held: { label: "Temporarily Held", bg: "bg-amber-600/25", text: "text-amber-300", border: "border-amber-500/40" },
    expired: { label: "Expired", bg: "bg-slate-600/25", text: "text-slate-400", border: "border-slate-500/40" },
    cancelled: { label: "Cancelled", bg: "bg-rose-600/25", text: "text-rose-300", border: "border-rose-500/40" },
    function_completed: { label: "Function Completed", bg: "bg-sky-600/25", text: "text-sky-300", border: "border-sky-500/40" },
    settlement_completed: { label: "Settlement Done", bg: "bg-violet-600/25", text: "text-violet-300", border: "border-violet-500/40" },
};

const REFUND_CFG = {
    pending: { label: "Refund Pending", cls: "text-amber-300" },
    initiated: { label: "Refund Initiated", cls: "text-sky-300" },
    processed: { label: "Refund Processed", cls: "text-emerald-300" },
    failed: { label: "Refund Failed", cls: "text-rose-300" },
};

function StatusBadge({ status }) {
    const c = STATUS_CFG[status] || { label: status, bg: "bg-white/10", text: "text-white/70", border: "border-white/20" };
    return (
        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
            {c.label}
        </span>
    );
}

function Row({ label, value, valueClass = "" }) {
    return (
        <div className="flex justify-between items-baseline py-1 text-sm border-b border-white/5 last:border-0">
            <span className="text-[#f6f3ea]/55">{label}</span>
            <span className={`font-semibold text-right ${valueClass}`}>{value}</span>
        </div>
    );
}

function AmountRow({ label, value, highlight = false, deduct = false }) {
    const cls = highlight
        ? "text-[#c9a227] text-lg"
        : deduct
            ? "text-rose-300"
            : "text-emerald-300";
    return (
        <div className={`flex justify-between items-baseline py-1 text-sm border-b border-white/5 last:border-0 ${highlight ? "border-t border-white/15 mt-1 pt-2" : ""}`}>
            <span className={deduct ? "text-rose-200/70" : highlight ? "font-bold" : "text-[#f6f3ea]/55"}>
                {label}
            </span>
            <span className={`font-bold ${cls}`}>{value}</span>
        </div>
    );
}

export default function BookingCard({ booking, actions = [], compact = false, onCancel }) {
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    const canCancel = typeof onCancel === "function" && (booking.status === "confirmed" || booking.status === "held");

    const handleCancelConfirm = async () => {
        setCancelling(true);
        setCancelError("");
        try {
            await onCancel(booking.id);
        } catch (err) {
            setCancelError(err.response?.data?.detail || "Could not cancel. Please try again.");
            setConfirming(false);
        } finally {
            setCancelling(false);
        }
    };

    const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
    const fmtDate = (d) =>
        d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: compact ? undefined : "short", day: "numeric", month: "short", year: "numeric" }) : "";

    const hasSettlement = booking.settlement_status === "completed" || booking.electricity_bill != null;
    const hasAdvance = (booking.refundable_advance || 0) > 0;
    const totalPaid = (booking.total_amount_inr || booking.amount_inr || 0);

    return (
        <article className="glass-card rounded-2xl p-5 space-y-4">

            {/* ── Top row: hall name + amount + status ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs uppercase tracking-widest text-[#c9a227]">{booking.hall_block}</p>
                    <h3 className={`font-semibold ${compact ? "text-base" : "text-xl"}`}>{booking.hall_name}</h3>
                    <p className="text-sm text-[#f6f3ea]/75">
                        {fmtDate(booking.booking_date)}&nbsp;·&nbsp;{booking.time_slot} ({booking.start_time}–{booking.end_time})
                    </p>
                    <p className="text-sm text-[#f6f3ea]/60">{booking.function_type}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {/* Show total paid if advance exists, else just booking fee */}
                    <div className="text-right">
                        {hasAdvance ? (
                            <>
                                <p className="text-xs text-[#f6f3ea]/40">Total paid</p>
                                <p className={`font-bold text-[#c9a227] ${compact ? "text-xl" : "text-2xl"}`}>
                                    {fmt(totalPaid)}
                                </p>
                            </>
                        ) : (
                            <p className={`font-bold text-[#c9a227] ${compact ? "text-xl" : "text-2xl"}`}>
                                {fmt(booking.amount_inr)}
                            </p>
                        )}
                    </div>
                    <StatusBadge status={booking.status} />

                    {/* Admin action buttons */}
                    {actions.length > 0 && (
                        <div className="flex gap-2 mt-1">
                            {actions.map((a) => (
                                <button
                                    key={a.label}
                                    onClick={a.onClick}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${a.variant === "confirm"
                                            ? "bg-emerald-700/60 text-emerald-100 hover:bg-emerald-700"
                                            : a.variant === "cancel"
                                                ? "bg-rose-800/60 text-rose-100 hover:bg-rose-800"
                                                : "glass-card hover:bg-white/10"
                                        }`}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* User cancel trigger */}
                    {canCancel && !confirming && (
                        <button
                            onClick={() => { setCancelError(""); setConfirming(true); }}
                            className="mt-1 rounded-md border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/15 transition-colors"
                        >
                            Cancel booking
                        </button>
                    )}
                </div>
            </div>

            {/* ── Payment breakdown (shown when advance > 0) ── */}
            {hasAdvance && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-0">
                    <p className="text-xs uppercase tracking-widest text-[#f6f3ea]/40 mb-2">Payment breakdown</p>
                    <Row label="Hall booking fee" value={fmt(booking.amount_inr)} />
                    <Row label="Refundable advance" value={fmt(booking.refundable_advance)} valueClass="text-emerald-300" />
                    <div className="border-t border-white/10 mt-1 pt-2 flex justify-between text-sm font-bold">
                        <span>Total paid</span>
                        <span className="text-[#c9a227]">{fmt(totalPaid)}</span>
                    </div>
                </div>
            )}

            {/* ── Payment ID ── */}
            {booking.razorpay_payment_id && (
                <p className="text-xs text-[#f6f3ea]/40 font-mono">
                    Pay ID: {booking.razorpay_payment_id}
                </p>
            )}

            {/* ── EB Settlement section ── */}
            {hasSettlement && (
                <div className="rounded-xl border border-violet-500/25 bg-violet-600/10 px-4 py-3 space-y-0">
                    <p className="text-xs uppercase tracking-widest text-violet-300 mb-2">
                        EB Settlement &amp; Refund
                    </p>
                    <AmountRow label="Security Advance" value={fmt(booking.refundable_advance)} />
                    <AmountRow label="(−) Electricity Bill" value={`− ${fmt(booking.electricity_bill)}`} deduct />
                    {(booking.other_deductions || 0) > 0 && (
                        <AmountRow label="(−) Other Deductions" value={`− ${fmt(booking.other_deductions)}`} deduct />
                    )}
                    <AmountRow label="Refund Amount" value={fmt(booking.refund_amount)} highlight />

                    {/* Refund status */}
                    {booking.refund_status && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                            <p className={`text-xs font-semibold ${REFUND_CFG[booking.refund_status]?.cls || "text-white/60"}`}>
                                {REFUND_CFG[booking.refund_status]?.label || booking.refund_status}
                            </p>
                            {booking.refund_date && (
                                <p className="text-xs text-[#f6f3ea]/40 mt-0.5">
                                    Processed: {new Date(booking.refund_date).toLocaleDateString("en-IN")}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Inline cancel confirmation ── */}
            {confirming && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 space-y-2">
                    <p className="text-sm font-medium text-rose-200">Cancel this booking?</p>
                    <p className="text-xs text-rose-300/70">
                        The slot will be immediately released and made available to others.
                        This cannot be undone.
                    </p>
                    {cancelError && <p className="text-xs text-rose-400">{cancelError}</p>}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleCancelConfirm}
                            disabled={cancelling}
                            className="rounded-md bg-rose-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50 transition-colors"
                        >
                            {cancelling ? "Cancelling…" : "Yes, cancel it"}
                        </button>
                        <button
                            onClick={() => { setConfirming(false); setCancelError(""); }}
                            disabled={cancelling}
                            className="rounded-md border border-white/20 px-4 py-1.5 text-sm hover:bg-white/5 transition-colors"
                        >
                            Keep booking
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}
