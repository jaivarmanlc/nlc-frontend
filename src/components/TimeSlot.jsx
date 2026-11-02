/**
 * TimeSlot – a single selectable / display time-slot card.
 *
 * Props:
 *   slot        – { id, label, start_time, end_time, status, hold_expires_at }
 *   selected    – boolean
 *   onSelect    – (slotId: string) => void   (omit to render read-only)
 *   showPrice   – optional price number to display
 */

import { useEffect, useState } from "react";

const styleMap = {
    available: {
        border: "border-emerald-400",
        bg: "bg-emerald-500/15",
        text: "text-emerald-100",
        badge: "bg-emerald-600/40 text-emerald-200",
        dot: "bg-emerald-400",
    },
    held: {
        border: "border-amber-400",
        bg: "bg-amber-500/15",
        text: "text-amber-100",
        badge: "bg-amber-600/40 text-amber-200",
        dot: "bg-amber-400 animate-pulse",
    },
    booked: {
        border: "border-rose-400",
        bg: "bg-rose-500/15",
        text: "text-rose-100",
        badge: "bg-rose-600/40 text-rose-200",
        dot: "bg-rose-400",
    },
};

const statusLabel = {
    available: "Available",
    held: "Temporarily Held",
    booked: "Booked",
};

function Countdown({ expiresAt }) {
    const [seconds, setSeconds] = useState(() => {
        if (!expiresAt) return 0;
        return Math.max(
            0,
            Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
        );
    });

    useEffect(() => {
        if (seconds <= 0) return;
        const id = setInterval(
            () => setSeconds((s) => Math.max(0, s - 1)),
            1000
        );
        return () => clearInterval(id);
    }, [seconds]);

    if (seconds <= 0) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (
        <p className="mt-1 text-xs tabular-nums opacity-75">
            releases in {m}:{String(s).padStart(2, "0")}
        </p>
    );
}

export default function TimeSlot({ slot, selected, onSelect, showPrice }) {
    const style = styleMap[slot.status] || styleMap.available;
    const disabled = slot.status !== "available";
    const interactive = typeof onSelect === "function";

    const Tag = interactive ? "button" : "div";

    return (
        <Tag
            type={interactive ? "button" : undefined}
            disabled={interactive ? disabled : undefined}
            onClick={interactive && !disabled ? () => onSelect(String(slot.id)) : undefined}
            className={[
                "rounded-xl border p-4 text-left transition-all",
                style.border,
                style.bg,
                style.text,
                selected ? "ring-2 ring-[#c9a227] ring-offset-1 ring-offset-transparent" : "",
                interactive && disabled ? "cursor-not-allowed opacity-60" : "",
                interactive && !disabled ? "hover:brightness-110 cursor-pointer" : "",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-base">{slot.label}</p>
                <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {statusLabel[slot.status]}
                </span>
            </div>

            {/* Time */}
            <p className="mt-1 text-sm opacity-80">
                {slot.start_time} – {slot.end_time}
            </p>

            {/* Price */}
            {showPrice != null && slot.status === "available" && (
                <p className="mt-2 font-semibold text-[#c9a227]">
                    ₹{Number(showPrice).toLocaleString("en-IN")}
                </p>
            )}

            {/* Hold countdown */}
            {slot.status === "held" && slot.hold_expires_at && (
                <Countdown expiresAt={slot.hold_expires_at} />
            )}
        </Tag>
    );
}
