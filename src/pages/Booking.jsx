/**
 * Booking (confirmation page) – rendered after a successful payment.
 * Route: /booking/:id   (optional; also reachable via /bookings for the full list)
 *
 * It loads the single booking by ID from /bookings/mine and shows a
 * rich confirmation card. Falls back gracefully if the booking isn't found.
 */

import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";

const statusConfig = {
    confirmed: { label: "Confirmed", color: "text-emerald-300", bg: "bg-emerald-600/20" },
    held: { label: "Temporarily Held", color: "text-amber-300", bg: "bg-amber-600/20" },
    expired: { label: "Expired", color: "text-slate-400", bg: "bg-slate-600/20" },
    cancelled: { label: "Cancelled", color: "text-rose-300", bg: "bg-rose-600/20" },
    function_completed: { label: "Function Completed", color: "text-blue-300", bg: "bg-blue-600/20" },
    settlement_completed: { label: "Settlement Completed", color: "text-purple-300", bg: "bg-purple-600/20" },
};

export default function BookingConfirmation() {
    const { user } = useAuth();
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        api
            .get("/bookings/mine")
            .then(({ data }) => {
                const found = id
                    ? data.find((b) => String(b.id) === String(id))
                    : data[0];
                setBooking(found || null);
            })
            .catch(() => setBooking(null))
            .finally(() => setLoading(false));
    }, [user, id]);

    if (!user) return <Navigate to="/login" replace />;

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <p className="text-[#f6f3ea]/60">Loading booking details…</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="glass-card mx-auto max-w-lg rounded-2xl p-8 text-center space-y-4">
                <p className="text-2xl font-semibold">Booking not found</p>
                <p className="text-[#f6f3ea]/60">
                    This booking doesn't exist or belongs to another account.
                </p>
                <Link
                    to="/bookings"
                    className="inline-block rounded-md bg-[#c9a227] px-5 py-2 font-semibold text-[#06201c]"
                >
                    View my bookings
                </Link>
            </div>
        );
    }

    const cfg = statusConfig[booking.status] || { label: booking.status, color: "text-white/70", bg: "bg-white/10" };
    const formattedDate = new Date(booking.booking_date + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="mx-auto max-w-xl space-y-6">
            {/* Status banner */}
            {booking.status === "confirmed" && (
                <div className="glass-card rounded-2xl border border-emerald-500/40 bg-emerald-600/10 p-6 text-center space-y-2">
                    <p className="text-4xl">🎉</p>
                    <p className="text-2xl font-semibold text-emerald-300">Booking Confirmed!</p>
                    <p className="text-sm text-[#f6f3ea]/70">
                        Your hall has been reserved. See the details below.
                    </p>
                </div>
            )}

            {booking.status === "function_completed" && (
                <div className="glass-card rounded-2xl border border-blue-500/40 bg-blue-600/10 p-6 text-center space-y-2">
                    <p className="text-4xl">✓</p>
                    <p className="text-2xl font-semibold text-blue-300">Function Completed</p>
                    <p className="text-sm text-[#f6f3ea]/70">
                        Your function is complete. Awaiting settlement and refund processing.
                    </p>
                </div>
            )}

            {booking.status === "settlement_completed" && (
                <div className="glass-card rounded-2xl border border-purple-500/40 bg-purple-600/10 p-6 text-center space-y-2">
                    <p className="text-4xl">💜</p>
                    <p className="text-2xl font-semibold text-purple-300">Settlement Complete</p>
                    <p className="text-sm text-[#f6f3ea]/70">
                        Settlement finalized. Your refund has been calculated and is being processed.
                    </p>
                </div>
            )}

            {/* Booking details card */}
            <article className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[#c9a227]">
                            {booking.hall_block}
                        </p>
                        <h2 className="mt-0.5 text-2xl font-semibold">{booking.hall_name}</h2>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-[#c9a227] text-xs uppercase tracking-wide mb-0.5">Date</p>
                        <p>{formattedDate}</p>
                    </div>
                    <div>
                        <p className="text-[#c9a227] text-xs uppercase tracking-wide mb-0.5">Time Slot</p>
                        <p>{booking.time_slot}</p>
                        <p className="text-[#f6f3ea]/60 text-xs">
                            {booking.start_time} – {booking.end_time}
                        </p>
                    </div>
                    <div>
                        <p className="text-[#c9a227] text-xs uppercase tracking-wide mb-0.5">
                            Function Type
                        </p>
                        <p>{booking.function_type}</p>
                    </div>
                    <div>
                        <p className="text-[#c9a227] text-xs uppercase tracking-wide mb-0.5">
                            Amount Paid
                        </p>
                        <p className="text-xl font-semibold text-[#c9a227]">
                            ₹{Number(booking.amount_inr).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* Refundable Advance Info */}
                {booking.refundable_advance > 0 && (
                    <div className="rounded-md border border-blue-500/30 bg-blue-600/10 px-4 py-3 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-blue-300 font-semibold">Refundable Advance</p>
                        <p className="text-lg font-semibold text-blue-200">
                            ₹{Number(booking.refundable_advance).toLocaleString("en-IN")}
                        </p>
                        {booking.total_amount_inr > 0 && (
                            <p className="text-xs text-blue-300/70">
                                Total payable: ₹{Number(booking.total_amount_inr).toLocaleString("en-IN")}
                            </p>
                        )}
                    </div>
                )}

                {/* Settlement Information */}
                {booking.settlement_status !== "pending" && (
                    <div className="rounded-md border border-purple-500/30 bg-purple-600/10 px-4 py-4 space-y-3">
                        <p className="text-xs uppercase tracking-wide text-purple-300 font-semibold">Settlement Details</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[#f6f3ea]/60 text-xs">EB Bill</p>
                                <p className="font-semibold text-white">
                                    ₹{Number(booking.electricity_bill || 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                            <div>
                                <p className="text-[#f6f3ea]/60 text-xs">Other Deductions</p>
                                <p className="font-semibold text-white">
                                    ₹{Number(booking.other_deductions || 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                            <div className="col-span-2 border-t border-purple-500/20 pt-2">
                                <p className="text-[#f6f3ea]/60 text-xs">Refund Amount</p>
                                <p className="text-lg font-bold text-emerald-300">
                                    ₹{Number(booking.refund_amount || 0).toLocaleString("en-IN")}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[#f6f3ea]/60 text-xs">Refund Status</p>
                                <p className="font-semibold text-white capitalize">
                                    {booking.refund_status}
                                    {booking.refund_date && (
                                        <span className="text-[#f6f3ea]/60 text-xs ml-2">
                                            · {new Date(booking.refund_date).toLocaleDateString("en-IN")}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment info */}
                {booking.razorpay_payment_id && (
                    <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-xs text-[#f6f3ea]/50 font-mono">
                        <span className="text-[#f6f3ea]/40 mr-2">Payment ID:</span>
                        {booking.razorpay_payment_id}
                    </div>
                )}

                {/* Booking ID */}
                <p className="text-xs text-[#f6f3ea]/40">
                    Booking #{booking.id} &nbsp;·&nbsp; Created{" "}
                    {new Date(booking.created_at).toLocaleString("en-IN")}
                </p>
            </article>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <Link
                    to="/bookings"
                    className="rounded-md border border-[#c9a227]/40 px-5 py-2 text-sm hover:bg-[#c9a227]/10 transition-colors"
                >
                    All my bookings
                </Link>
                <Link
                    to="/book"
                    className="rounded-md bg-[#c9a227] px-5 py-2 text-sm font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors"
                >
                    Book another hall
                </Link>
            </div>
        </div>
    );
}
