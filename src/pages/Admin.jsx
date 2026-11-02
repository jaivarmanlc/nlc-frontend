import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import BookingCard from "../components/BookingCard";

const TABS = ["Halls", "Slots", "Prices", "Function Types", "Bookings", "Settlement", "Availability"];

const inputCls =
  "rounded-md border border-white/10 bg-[#06201c] px-3 py-2 text-sm placeholder-[#f6f3ea]/30 focus:border-[#c9a227]/60 focus:outline-none w-full";
const btnCls =
  "rounded-md bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Bookings");

  // Data
  const [halls, setHalls] = useState([]);
  const [slots, setSlots] = useState([]);
  const [prices, setPrices] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);

  // Toast
  const [msg, setMsg] = useState({ text: "", ok: true });

  // Forms
  const [hallForm, setHallForm] = useState({
    name: "", block: "", description: "", capacity: 200, amenities: "", cover_image: "",
  });
  const [slotForm, setSlotForm] = useState({ hall_id: "", label: "", start_time: "06:00", end_time: "12:00" });
  const [priceForm, setPriceForm] = useState({
    hall_id: "", function_type_id: "", time_slot_id: "", amount_inr: "", advance_percentage: "50",
  });
  const [funcForm, setFuncForm] = useState({ name: "", description: "" });
  const [blockForm, setBlockForm] = useState({ hall_id: "", booking_date: "", time_slot_id: "", reason: "Maintenance" });

  // Settlement form per booking id
  const [settleForm, setSettleForm] = useState({});  // { [bookingId]: { electricity_bill, other_deductions, notes } }
  const [settleBusy, setSettleBusy] = useState({});
  const [refundBusy, setRefundBusy] = useState({});

  // ── helpers ──────────────────────────────────────────────────────────────
  const notify = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: "", ok: true }), 3500);
  };

  const load = async () => {
    try {
      const [h, s, p, f, b, bl] = await Promise.all([
        api.get("/admin/halls"),
        api.get("/admin/slots"),
        api.get("/admin/prices"),
        api.get("/admin/function-types"),
        api.get("/admin/bookings"),
        api.get("/admin/blocks"),
      ]);
      setHalls(h.data);
      setSlots(s.data);
      setPrices(p.data);
      setFunctions(f.data);
      setBookings(b.data);
      setBlocks(bl.data);
      if (h.data[0]) {
        const fid = String(h.data[0].id);
        setSlotForm((prev) => prev.hall_id ? prev : { ...prev, hall_id: fid });
        setPriceForm((prev) => prev.hall_id ? prev : { ...prev, hall_id: fid });
        setBlockForm((prev) => prev.hall_id ? prev : { ...prev, hall_id: fid });
      }
      if (f.data[0])
        setPriceForm((prev) => prev.function_type_id ? prev : { ...prev, function_type_id: String(f.data[0].id) });
    } catch {
      notify("Failed to load data", false);
    }
  };

  useEffect(() => { if (user?.is_admin) load(); }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <p className="text-xl font-semibold text-rose-300">Admin access required</p>
    </div>
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveHall = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/halls", { ...hallForm, capacity: Number(hallForm.capacity) });
      notify("Hall saved");
      setHallForm({ name: "", block: "", description: "", capacity: 200, amenities: "", cover_image: "" });
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const toggleHall = async (hall) => {
    await api.patch(`/admin/halls/${hall.id}`, { is_active: !hall.is_active });
    load();
  };

  const saveSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/slots", { ...slotForm, hall_id: Number(slotForm.hall_id) });
      notify("Slot added");
      setSlotForm((prev) => ({ ...prev, label: "" }));
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const toggleSlot = async (slot) => {
    await api.patch(`/admin/slots/${slot.id}`, { is_active: !slot.is_active });
    load();
  };

  const savePrice = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/prices", {
        hall_id: Number(priceForm.hall_id),
        function_type_id: Number(priceForm.function_type_id),
        time_slot_id: Number(priceForm.time_slot_id),
        amount_inr: Number(priceForm.amount_inr),
        advance_percentage: Number(priceForm.advance_percentage),
      });
      notify("Price saved");
      setPriceForm((prev) => ({ ...prev, amount_inr: "", advance_percentage: "50" }));
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const saveFunc = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/function-types", funcForm);
      notify("Function type added");
      setFuncForm({ name: "", description: "" });
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const updateBooking = async (id, status) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { status });
      notify(`Booking ${status}`);
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const markComplete = async (id) => {
    try {
      await api.post(`/admin/bookings/${id}/complete`, {});
      notify("Marked as function completed");
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const submitSettlement = async (id) => {
    const form = settleForm[id] || {};
    if (form.electricity_bill === "" || form.electricity_bill == null) {
      notify("Enter the EB bill amount", false);
      return;
    }
    setSettleBusy((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/admin/bookings/${id}/settlement`, {
        electricity_bill: Number(form.electricity_bill),
        other_deductions: Number(form.other_deductions || 0),
        notes: form.notes || "",
      });
      notify("Settlement saved – refund calculated");
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
    finally { setSettleBusy((prev) => ({ ...prev, [id]: false })); }
  };

  const initiateRefund = async (id) => {
    setRefundBusy((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/admin/bookings/${id}/refund`, {});
      notify("Refund initiated successfully");
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
    finally { setRefundBusy((prev) => ({ ...prev, [id]: false })); }
  };

  const saveBlock = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/blocks", {
        hall_id: Number(blockForm.hall_id),
        booking_date: blockForm.booking_date,
        time_slot_id: blockForm.time_slot_id ? Number(blockForm.time_slot_id) : null,
        reason: blockForm.reason,
      });
      notify("Block added");
      setBlockForm((prev) => ({ ...prev, booking_date: "" }));
      load();
    } catch (err) { notify(err.response?.data?.detail || "Failed", false); }
  };

  const removeBlock = async (id) => {
    await api.delete(`/admin/blocks/${id}`);
    load();
  };

  const slotsForHall = (hid) => slots.filter((s) => String(s.hall_id) === String(hid));

  // ── Bookings that are ready for settlement (function_completed) ────────────
  const completedBookings = bookings.filter(
    (b) => b.status === "function_completed" || b.status === "settlement_completed"
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">Admin console</p>
        <h2 className="mt-1 text-3xl font-semibold">Management panel</h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === t ? "bg-[#c9a227] text-[#06201c]" : "glass-card hover:bg-white/10"
              }`}
          >
            {t}
            {t === "Settlement" && completedBookings.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs text-white">
                {completedBookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toast */}
      {msg.text && (
        <p className={`rounded-md px-4 py-2 text-sm font-medium ${msg.ok ? "bg-emerald-600/20 text-emerald-300" : "bg-rose-600/20 text-rose-300"}`}>
          {msg.text}
        </p>
      )}

      {/* ════════════ HALLS ════════════ */}
      {tab === "Halls" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={saveHall} className="glass-card space-y-3 rounded-2xl p-5">
            <h3 className="text-lg font-semibold">Add hall</h3>
            {["name", "block", "description", "amenities", "cover_image"].map((f) => (
              <input key={f} className={inputCls} placeholder={f.replace(/_/g, " ")}
                value={hallForm[f]} onChange={(e) => setHallForm({ ...hallForm, [f]: e.target.value })}
                required={f === "name" || f === "block"} />
            ))}
            <input type="number" className={inputCls} placeholder="Capacity"
              value={hallForm.capacity} onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })} />
            <button className={btnCls}>Save hall</button>
          </form>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">All halls ({halls.length})</h3>
            {halls.map((h) => (
              <article key={h.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#c9a227]">{h.block}</p>
                    <p className="font-semibold">{h.name}</p>
                    <p className="text-xs text-[#f6f3ea]/60">Cap: {h.capacity} · <span className={h.is_active ? "text-emerald-400" : "text-rose-400"}>{h.is_active ? "Active" : "Inactive"}</span></p>
                  </div>
                  <button className="text-xs underline opacity-70 hover:opacity-100" onClick={() => toggleHall(h)}>
                    {h.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ SLOTS ════════════ */}
      {tab === "Slots" && (
        <div className="space-y-4">
          <form onSubmit={saveSlot} className="glass-card grid gap-3 rounded-2xl p-5 md:grid-cols-2">
            <h3 className="text-lg font-semibold md:col-span-2">Add time slot</h3>
            <select className={inputCls} value={slotForm.hall_id} onChange={(e) => setSlotForm({ ...slotForm, hall_id: e.target.value })}>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <input className={inputCls} placeholder="Label (e.g. Morning)" required value={slotForm.label}
              onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs text-[#f6f3ea]/60">Start time</label>
              <input type="time" className={inputCls} value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#f6f3ea]/60">End time</label>
              <input type="time" className={inputCls} value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} />
            </div>
            <div className="md:col-span-2"><button className={btnCls}>Add slot</button></div>
          </form>

          <div className="overflow-auto glass-card rounded-2xl">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[#c9a227] text-xs uppercase">
                <th className="p-3">Hall</th><th>Label</th><th>Time</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-3">{halls.find((h) => h.id === s.hall_id)?.name || `#${s.hall_id}`}</td>
                    <td>{s.label}</td>
                    <td className="tabular-nums">{s.start_time}–{s.end_time}</td>
                    <td><span className={`text-xs font-semibold ${s.is_active ? "text-emerald-400" : "text-rose-400"}`}>{s.is_active ? "Active" : "Inactive"}</span></td>
                    <td><button className="text-xs underline opacity-70 hover:opacity-100" onClick={() => toggleSlot(s)}>Toggle</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ PRICES ════════════ */}
      {tab === "Prices" && (
        <div className="space-y-4">
          <form onSubmit={savePrice} className="glass-card grid gap-3 rounded-2xl p-5 md:grid-cols-2">
            <h3 className="text-lg font-semibold md:col-span-2">Set / update price</h3>
            <select className={inputCls} value={priceForm.hall_id}
              onChange={(e) => setPriceForm({ ...priceForm, hall_id: e.target.value, time_slot_id: "" })}>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select className={inputCls} value={priceForm.function_type_id}
              onChange={(e) => setPriceForm({ ...priceForm, function_type_id: e.target.value })}>
              <option value="">Select function type</option>
              {functions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select className={inputCls} value={priceForm.time_slot_id}
              onChange={(e) => setPriceForm({ ...priceForm, time_slot_id: e.target.value })}>
              <option value="">Select time slot</option>
              {slotsForHall(priceForm.hall_id).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <input type="number" className={inputCls} placeholder="Amount (₹)" required
              value={priceForm.amount_inr} onChange={(e) => setPriceForm({ ...priceForm, amount_inr: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs text-[#f6f3ea]/60">Refundable advance % (default 50)</label>
              <input type="number" min="0" max="100" className={inputCls} placeholder="50"
                value={priceForm.advance_percentage}
                onChange={(e) => setPriceForm({ ...priceForm, advance_percentage: e.target.value })} />
            </div>
            <div className="md:col-span-2 md:flex md:items-end"><button className={btnCls}>Save price</button></div>
          </form>

          <div className="overflow-auto glass-card rounded-2xl">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[#c9a227] text-xs uppercase">
                <th className="p-3">Hall</th><th>Function</th><th>Slot</th><th>Price</th><th>Advance %</th>
              </tr></thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-3">{p.hall_name}</td>
                    <td>{p.function_name}</td>
                    <td>{p.slot_label}</td>
                    <td className="font-semibold text-[#c9a227]">₹{Number(p.amount_inr).toLocaleString("en-IN")}</td>
                    <td className="text-emerald-400">{p.advance_percentage ?? 50}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════ FUNCTION TYPES ════════════ */}
      {tab === "Function Types" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={saveFunc} className="glass-card space-y-3 rounded-2xl p-5">
            <h3 className="text-lg font-semibold">Add function type</h3>
            <input className={inputCls} placeholder="Name" required value={funcForm.name}
              onChange={(e) => setFuncForm({ ...funcForm, name: e.target.value })} />
            <input className={inputCls} placeholder="Description" value={funcForm.description}
              onChange={(e) => setFuncForm({ ...funcForm, description: e.target.value })} />
            <button className={btnCls}>Add</button>
          </form>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Types ({functions.length})</h3>
            {functions.map((f) => (
              <div key={f.id} className="glass-card rounded-xl px-4 py-3">
                <p className="font-medium">{f.name}</p>
                {f.description && <p className="text-xs text-[#f6f3ea]/60">{f.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════ BOOKINGS ════════════ */}
      {tab === "Bookings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All bookings ({bookings.length})</h3>
            <button className="text-xs underline opacity-70 hover:opacity-100" onClick={load}>Refresh</button>
          </div>
          {bookings.length === 0 && <p className="glass-card rounded-2xl p-6 text-[#f6f3ea]/50">No bookings yet.</p>}
          {bookings.map((b) => {
            const isConfirmed = b.status === "confirmed";
            return (
              <BookingCard key={b.id} booking={b} compact
                actions={[
                  ...(isConfirmed ? [{
                    label: "Mark Complete",
                    variant: "confirm",
                    onClick: () => markComplete(b.id),
                  }] : []),
                  { label: "Confirm", variant: "confirm", onClick: () => updateBooking(b.id, "confirmed") },
                  { label: "Cancel", variant: "cancel", onClick: () => updateBooking(b.id, "cancelled") },
                ]}
              />
            );
          })}
        </div>
      )}

      {/* ════════════ SETTLEMENT ════════════ */}
      {tab === "Settlement" && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-lg font-semibold">EB Bill &amp; Refund Settlement</h3>
            <p className="text-sm text-[#f6f3ea]/60 mt-1">
              After the function is completed, enter the actual EB (electricity) bill.
              The system calculates the refund: <em>Advance − EB bill − Other deductions</em>.
            </p>
          </div>

          {completedBookings.length === 0 && (
            <p className="glass-card rounded-2xl p-6 text-[#f6f3ea]/50">
              No bookings awaiting settlement.
            </p>
          )}

          {completedBookings.map((b) => {
            const sf = settleForm[b.id] || { electricity_bill: "", other_deductions: "0", notes: "" };
            const needsSettlement = b.status === "function_completed";
            const settled = b.status === "settlement_completed";
            const needsRefund = settled && b.refund_status === "pending";

            return (
              <div key={b.id} className="glass-card rounded-2xl p-5 space-y-4">
                {/* Booking summary header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#c9a227]">{b.hall_block}</p>
                    <p className="font-semibold text-lg">{b.hall_name}</p>
                    <p className="text-sm text-[#f6f3ea]/70">
                      {b.booking_date} · {b.time_slot} · {b.function_type}
                    </p>
                    <p className="text-xs text-[#f6f3ea]/50">
                      Booking: ₹{Number(b.amount_inr).toLocaleString("en-IN")} &nbsp;+&nbsp;
                      Advance: ₹{Number(b.refundable_advance).toLocaleString("en-IN")} &nbsp;=&nbsp;
                      <span className="text-[#c9a227] font-semibold">
                        Total ₹{Number(b.total_amount_inr).toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${settled
                      ? "bg-violet-600/25 text-violet-300 border-violet-500/40"
                      : "bg-sky-600/25 text-sky-300 border-sky-500/40"
                    }`}>
                    {settled ? "Settlement Done" : "Awaiting EB Bill"}
                  </span>
                </div>

                {/* Settlement already done — show calculated refund */}
                {settled && (
                  <div className="rounded-xl border border-violet-500/25 bg-violet-600/10 px-4 py-3 space-y-1 text-sm">
                    <p className="text-xs uppercase tracking-widest text-violet-300 mb-2">Settlement Summary</p>
                    <div className="flex justify-between"><span className="text-[#f6f3ea]/55">Security Advance</span><span className="text-emerald-300 font-semibold">₹{Number(b.refundable_advance).toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-rose-300/70">(−) EB Bill</span><span className="text-rose-300 font-semibold">−₹{Number(b.electricity_bill || 0).toLocaleString("en-IN")}</span></div>
                    {(b.other_deductions || 0) > 0 && (
                      <div className="flex justify-between"><span className="text-rose-300/70">(−) Other</span><span className="text-rose-300 font-semibold">−₹{Number(b.other_deductions).toLocaleString("en-IN")}</span></div>
                    )}
                    <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base">
                      <span>Refund Amount</span><span className="text-[#c9a227]">₹{Number(b.refund_amount || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-[#f6f3ea]/40">Refund status</span>
                      <span className={`font-semibold uppercase ${b.refund_status === "processed" ? "text-emerald-400" :
                          b.refund_status === "initiated" ? "text-sky-400" : "text-amber-400"
                        }`}>{b.refund_status}</span>
                    </div>
                  </div>
                )}

                {/* EB bill entry form */}
                {needsSettlement && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 space-y-3">
                    <p className="text-sm font-semibold text-amber-200">Enter EB Bill &amp; Deductions</p>
                    <p className="text-xs text-amber-300/70">
                      Refundable advance: <strong>₹{Number(b.refundable_advance).toLocaleString("en-IN")}</strong>
                      &nbsp;·&nbsp; Refund = Advance − EB bill − Deductions
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-[#f6f3ea]/60">EB Bill Amount (₹) *</label>
                        <input type="number" min="0" className={inputCls} placeholder="e.g. 2000"
                          value={sf.electricity_bill}
                          onChange={(e) => setSettleForm((prev) => ({ ...prev, [b.id]: { ...sf, electricity_bill: e.target.value } }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-[#f6f3ea]/60">Other Deductions (₹)</label>
                        <input type="number" min="0" className={inputCls} placeholder="0"
                          value={sf.other_deductions}
                          onChange={(e) => setSettleForm((prev) => ({ ...prev, [b.id]: { ...sf, other_deductions: e.target.value } }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs text-[#f6f3ea]/60">Notes (optional)</label>
                        <input className={inputCls} placeholder="Any remarks about the settlement"
                          value={sf.notes}
                          onChange={(e) => setSettleForm((prev) => ({ ...prev, [b.id]: { ...sf, notes: e.target.value } }))} />
                      </div>
                    </div>

                    {/* Live calculation preview */}
                    {sf.electricity_bill !== "" && (
                      <div className="rounded-md bg-white/5 px-3 py-2 text-sm">
                        <span className="text-[#f6f3ea]/60">Calculated refund: </span>
                        <span className="font-bold text-[#c9a227]">
                          ₹{Math.max(0,
                            Number(b.refundable_advance) -
                            Number(sf.electricity_bill || 0) -
                            Number(sf.other_deductions || 0)
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <button className={btnCls} disabled={settleBusy[b.id]}
                      onClick={() => submitSettlement(b.id)}>
                      {settleBusy[b.id] ? "Saving…" : "Save settlement & send email"}
                    </button>
                  </div>
                )}

                {/* Refund initiation */}
                {needsRefund && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 space-y-2">
                    <p className="text-sm font-semibold text-emerald-200">
                      Initiate Refund — ₹{Number(b.refund_amount || 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-emerald-300/70">
                      Clicking below will trigger a Razorpay refund to the user's original
                      payment method (or record a demo refund if in test mode).
                    </p>
                    <button
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                      disabled={refundBusy[b.id]}
                      onClick={() => initiateRefund(b.id)}
                    >
                      {refundBusy[b.id] ? "Processing…" : "Initiate Refund"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════ AVAILABILITY ════════════ */}
      {tab === "Availability" && (
        <div className="space-y-4">
          <form onSubmit={saveBlock} className="glass-card grid gap-3 rounded-2xl p-5 md:grid-cols-2">
            <h3 className="text-lg font-semibold md:col-span-2">Block a date / slot</h3>
            <select className={inputCls} value={blockForm.hall_id}
              onChange={(e) => setBlockForm({ ...blockForm, hall_id: e.target.value, time_slot_id: "" })}>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <input type="date" className={inputCls} required value={blockForm.booking_date}
              onChange={(e) => setBlockForm({ ...blockForm, booking_date: e.target.value })} />
            <select className={inputCls} value={blockForm.time_slot_id}
              onChange={(e) => setBlockForm({ ...blockForm, time_slot_id: e.target.value })}>
              <option value="">Entire day</option>
              {slotsForHall(blockForm.hall_id).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <input className={inputCls} placeholder="Reason" value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} />
            <div className="md:col-span-2"><button className={btnCls}>Block</button></div>
          </form>

          <h3 className="text-lg font-semibold">Current blocks ({blocks.length})</h3>
          {blocks.length === 0 && <p className="text-sm text-[#f6f3ea]/50">No blocks set.</p>}
          {blocks.map((bl) => (
            <div key={bl.id} className="glass-card flex items-center justify-between gap-3 rounded-xl px-4 py-3">
              <div className="text-sm">
                <p className="font-medium">
                  {halls.find((h) => h.id === bl.hall_id)?.name || `Hall #${bl.hall_id}`}
                  {" · "}<span className="text-[#c9a227]">{bl.booking_date}</span>
                </p>
                <p className="text-[#f6f3ea]/60">
                  {bl.time_slot_id
                    ? `Slot: ${slots.find((s) => s.id === bl.time_slot_id)?.label || `#${bl.time_slot_id}`}`
                    : "Entire day"
                  } · {bl.reason}
                </p>
              </div>
              <button className="text-xs text-rose-400 underline hover:text-rose-300" onClick={() => removeBlock(bl.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
