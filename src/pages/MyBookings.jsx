import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import BookingCard from "../components/BookingCard";

const FILTER_OPTIONS = ["All", "confirmed", "held", "expired", "cancelled", "function_completed", "settlement_completed"];

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const load = () => {
    if (!user) return;
    setLoading(true);
    api
      .get("/bookings/mine")
      .then(({ data }) => setBookings(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  // Called by BookingCard when user confirms cancellation
  const handleCancel = async (bookingId) => {
    const { data: updated } = await api.post(`/bookings/${bookingId}/cancel`);
    // Replace the booking in local state immediately — slot is now freed on the backend
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  };

  const visible =
    filter === "All"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const counts = FILTER_OPTIONS.reduce((acc, key) => {
    acc[key] =
      key === "All"
        ? bookings.length
        : bookings.filter((b) => b.status === key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">
          {user.name}
        </p>
        <h2 className="mt-1 text-3xl font-semibold">My Bookings</h2>
        <p className="mt-1 text-sm text-[#f6f3ea]/60">
          Confirmed reservations appear here after successful payment
          verification.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === opt
                ? "bg-[#c9a227] text-[#06201c]"
                : "glass-card hover:bg-white/10"
              }`}
          >
            {opt === "All"
              ? "All"
              : opt.charAt(0).toUpperCase() + opt.slice(1)}
            {counts[opt] > 0 && (
              <span className="ml-1.5 opacity-70">({counts[opt]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <p className="glass-card rounded-2xl p-6 text-[#f6f3ea]/50">
          Loading…
        </p>
      )}

      {!loading && visible.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <p className="text-xl font-semibold">No bookings yet</p>
          <p className="text-sm text-[#f6f3ea]/60">
            Once you complete a booking, it will appear here.
          </p>
          <Link
            to="/book"
            className="inline-block rounded-md bg-[#c9a227] px-5 py-2 text-sm font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors"
          >
            Book a hall now
          </Link>
        </div>
      )}

      {visible.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
