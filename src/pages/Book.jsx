import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import DemoPaymentModal from "../components/DemoPaymentModal";
import TimeSlot from "../components/TimeSlot";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Book() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialHall = searchParams.get("hall") || "";

  const [halls, setHalls] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [hallId, setHallId] = useState(initialHall);
  const [functionId, setFunctionId] = useState("");
  const [bookingDate, setBookingDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState("");
  const [price, setPrice] = useState(null);          // { amount_inr, refundable_advance, total_amount_inr, advance_percentage }
  const [notes, setNotes] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [error, setError] = useState("");
  const [documentLoading, setDocumentLoading] = useState("");
  const [busy, setBusy] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  // Demo payment modal state
  const [demoOrder, setDemoOrder] = useState(null);

  useEffect(() => {
    if (bookingDate < todayISO()) setBookingDate(todayISO());
  }, [bookingDate]);

  // Load halls and function types once
  useEffect(() => {
    Promise.all([api.get("/halls"), api.get("/function-types")])
      .then(([hallRes, funcRes]) => {
        setHalls(hallRes.data);
        setFunctions(funcRes.data);
        if (!hallId && hallRes.data[0]) setHallId(String(hallRes.data[0].id));
        if (funcRes.data[0]) setFunctionId(String(funcRes.data[0].id));
      })
      .catch(() => { });
  }, []);

  // Reload slots when hall or date changes
  useEffect(() => {
    if (!hallId || !bookingDate || bookingDate < todayISO()) return;
    setSlotId("");
    setPrice(null);
    setSlotsLoading(true);
    api
      .get("/availability", {
        params: { hall_id: hallId, booking_date: bookingDate },
      })
      .then(({ data }) => setSlots(data))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [hallId, bookingDate]);

  // Refresh price when combination changes
  useEffect(() => {
    if (!hallId || !functionId || !slotId) {
      setPrice(null);
      return;
    }
    api
      .post("/price-quote", {
        hall_id: Number(hallId),
        function_type_id: Number(functionId),
        time_slot_id: Number(slotId),
      })
      .then(({ data }) => setPrice({
        amount_inr: data.amount_inr,
        refundable_advance: data.refundable_advance,
        total_amount_inr: data.total_amount_inr,
        advance_percentage: data.advance_percentage,
      }))
      .catch(() => setPrice(null));
  }, [hallId, functionId, slotId]);

  const selectedHall = useMemo(
    () => halls.find((h) => String(h.id) === String(hallId)),
    [halls, hallId]
  );

  const selectedSlot = useMemo(
    () => slots.find((s) => String(s.id) === String(slotId)),
    [slots, slotId]
  );

  const pay = async () => {
    setError("");
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/book" } } });
      return;
    }
    if (!slotId) {
      setError("Please select an available time slot.");
      return;
    }
    setBusy(true);
    try {
      const { data: order } = await api.post("/bookings/hold", {
        hall_id: Number(hallId),
        function_type_id: Number(functionId),
        time_slot_id: Number(slotId),
        booking_date: bookingDate,
        number_of_guests: numberOfGuests ? Number(numberOfGuests) : 0,
        notes,
      });

      if (order.demo_mode) {
        // Show the Razorpay-style demo payment modal
        setDemoOrder(order);
        return;
      }

      // Live Razorpay checkout
      const options = {
        key: order.razorpay_key_id,
        amount: Math.round(order.total_amount_inr * 100),
        currency: "INR",
        name: "NLC Community Hall",
        description: `${selectedHall?.name || "Hall"} · ${selectedSlot?.label || ""}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.mobile,
        },
        theme: { color: "#0b5c4d" },
        handler: async (response) => {
          try {
            await api.post("/bookings/verify", {
              booking_id: order.booking_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate("/bookings");
          } catch (verifyErr) {
            setError(
              verifyErr.response?.data?.detail ||
              "Payment verification failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: async () => {
            // Release the hold so the slot becomes available again
            await api.delete(`/bookings/${order.booking_id}/hold`).catch(() => { });
            // Refresh slot availability
            const { data } = await api.get("/availability", {
              params: { hall_id: hallId, booking_date: bookingDate },
            });
            setSlots(data);
            setSlotId("");
          },
        },
      };
      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to start payment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Demo modal handlers
  const handleDemoSuccess = () => {
    setDemoOrder(null);
    navigate("/bookings");
  };

  const handleDemoCancel = async () => {
    setDemoOrder(null);
    setSlotId("");
    // Refresh slots to reflect the released hold
    if (hallId && bookingDate) {
      const { data } = await api
        .get("/availability", { params: { hall_id: hallId, booking_date: bookingDate } })
        .catch(() => ({ data: slots }));
      setSlots(data);
    }
  };

  const openIdentityDocument = async (documentType) => {
    setDocumentLoading(documentType);
    try {
      const { data } = await api.get(`/auth/documents/${documentType}`, {
        responseType: "blob",
      });
      const documentUrl = URL.createObjectURL(data);
      window.location.assign(documentUrl);
      window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60000);
    } catch {
      setError("Unable to open the identity document. Please try again.");
    } finally {
      setDocumentLoading("");
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ── Left: booking form ── */}
        <section className="glass-card space-y-5 rounded-2xl p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">
              NLC Township
            </p>
            <h2 className="mt-1 text-3xl font-semibold">Reserve a hall</h2>
          </div>

          {/* Hall selector */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-white/80">Hall</span>
            <select
              className="w-full rounded-md border border-white/15 bg-[#0d2b2a] px-3 py-2 text-[#f6f3ea] placeholder:text-white/40 focus:border-[#c9a227] focus:outline-none"
              style={{ colorScheme: "dark" }}
              value={hallId}
              onChange={(e) => setHallId(e.target.value)}
            >
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id} className="bg-[#0d2b2a] text-[#f6f3ea]">
                  {hall.block} · {hall.name}
                </option>
              ))}
            </select>
          </label>

          {/* Function type */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-white/80">Function type</span>
            <select
              className="w-full rounded-md border border-white/15 bg-[#0d2b2a] px-3 py-2 text-[#f6f3ea] placeholder:text-white/40 focus:border-[#c9a227] focus:outline-none"
              style={{ colorScheme: "dark" }}
              value={functionId}
              onChange={(e) => setFunctionId(e.target.value)}
            >
              {functions.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#0d2b2a] text-[#f6f3ea]">
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          {/* Date */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-white/80">Date</span>
            <input
              type="date"
              min={todayISO()}
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </label>

          {/* Time slots */}
          <div>
            <p className="mb-2 text-sm font-medium">Time slots</p>
            {slotsLoading ? (
              <p className="text-sm text-[#f6f3ea]/50">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[#f6f3ea]/50">
                No slots available for this date.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {slots.map((slot) => (
                  <TimeSlot
                    key={slot.id}
                    slot={slot}
                    selected={String(slot.id) === String(slotId)}
                    onSelect={setSlotId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-white/80">
              Notes{" "}
              <span className="font-normal text-white/50">(optional)</span>
            </span>
            <input
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              placeholder="Any special requirements…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {/* Number of Guests */}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-white/80">
              Number of Guests{" "}
              <span className="font-normal text-white/50">(optional)</span>
            </span>
            <input
              type="number"
              className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none"
              placeholder="Enter number of guests"
              min="0"
              value={numberOfGuests}
              onChange={(e) => setNumberOfGuests(e.target.value)}
            />
          </label>
        </section>

        {/* ── Right: summary & payment ── */}
        <aside className="glass-card h-fit space-y-5 rounded-2xl p-6 lg:sticky lg:top-24">
          {user && (
            <section className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-inner shadow-white/5 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.24em] text-[#c9a227]">Verified identity</p>
              <p className="mt-1 text-sm text-white/60">Tap a number to view its PDF</p>
              <div className="mt-4 space-y-2">
                {[
                  ["Employee number", user.nlc_employee_number, "employee"],
                  ["Aadhaar number", user.aadhaar_number, "aadhaar"],
                ].map(([label, value, documentType]) => (
                  <button
                    key={documentType}
                    type="button"
                    onClick={() => openIdentityDocument(documentType)}
                    disabled={!value || documentLoading === documentType}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-left transition hover:border-[#c9a227]/70 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="text-xs text-white/55">{label}</span>
                    <span className="font-mono text-sm text-[#f6f3ea] underline decoration-[#c9a227]/70 underline-offset-4">
                      {documentLoading === documentType ? "Opening…" : value || "Not available"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <h3 className="text-xl font-semibold text-white">Booking summary</h3>

          {selectedHall ? (
            <>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/70">
                  {selectedHall.block}
                </p>
                <p className="font-semibold text-white">{selectedHall.name}</p>
                <p className="text-sm text-white/60">
                  Capacity: {selectedHall.capacity} guests
                </p>
              </div>

              {slotId && selectedSlot ? (
                <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm space-y-1">
                  <p className="font-medium">{selectedSlot.label} slot</p>
                  <p className="text-[#f6f3ea]/60">
                    {selectedSlot.start_time} – {selectedSlot.end_time}
                  </p>
                  <p className="text-[#f6f3ea]/60">{bookingDate}</p>
                </div>
              ) : (
                <p className="text-sm text-[#f6f3ea]/50">
                  Select an available time slot to see pricing.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#f6f3ea]/50">Select a hall to get started.</p>
          )}

          {/* Price Breakdown */}
          <div>
            <p className="text-xs uppercase tracking-wide text-[#f6f3ea]/50 mb-2">
              Booking Amount
            </p>
            {price != null ? (
              <div className="space-y-2">
                {/* Line items */}
                <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Hall booking fee</span>
                    <span className="font-medium">
                      ₹{Number(price.amount_inr).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>
                      Refundable advance
                      <span className="ml-1 text-xs opacity-70">
                        ({Number(price.advance_percentage).toFixed(0)}%)
                      </span>
                    </span>
                    <span className="font-medium">
                      ₹{Number(price.refundable_advance).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between">
                    <span className="font-semibold">Total to pay</span>
                    <span className="text-2xl font-bold text-[#c9a227]">
                      ₹{Number(price.total_amount_inr).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                {/* Advance note */}
                <p className="text-xs text-emerald-400/80 leading-relaxed">
                  ✦ Refundable advance of{" "}
                  <span className="font-semibold">
                    ₹{Number(price.refundable_advance).toLocaleString("en-IN")}
                  </span>{" "}
                  is returned after the function, minus actual EB (electricity)
                  bill usage.
                </p>
              </div>
            ) : (
              <p className="text-3xl font-semibold text-white/40">—</p>
            )}
          </div>

          <p className="text-xs text-[#f6f3ea]/50">
            Your slot is held for 10 minutes during checkout. It is released
            automatically if payment is abandoned.
          </p>

          {error && (
            <p className="rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          {!user && (
            <p className="text-sm text-[#f6f3ea]/60">
              Please{" "}
              <Link
                to="/login"
                state={{ from: { pathname: "/book" } }}
                className="text-white underline underline-offset-4"
              >
                login or register
              </Link>{" "}
              to complete the booking.
            </p>
          )}

          <button
            disabled={busy || !slotId}
            onClick={pay}
            className="w-full rounded-md bg-white py-3 font-semibold text-slate-900 transition-colors hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Processing…" : user ? "Pay & confirm" : "Login to pay"}
          </button>
        </aside>
      </div>

      {/* Demo payment modal – shown only when no live Razorpay keys are configured */}
      {
        demoOrder && (
          <DemoPaymentModal
            order={demoOrder}
            hall={selectedHall || { name: "NLC Hall", block: "" }}
            slot={selectedSlot || { label: "", start_time: "", end_time: "" }}
            bookingDate={bookingDate}
            user={user}
            onSuccess={handleDemoSuccess}
            onCancel={handleDemoCancel}
          />
        )
      }
    </>
  );
}
