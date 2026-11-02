const STORAGE_KEY = "nlc_demo_data";
const DEMO_USERS = [
  {
    id: 1,
    name: "Township Resident",
    email: "user@nlc.in",
    mobile: "9888888888",
    nlc_employee_number: "NLC-DEMO-001",
    aadhaar_number: "XXXX XXXX 1234",
    is_admin: false,
  },
  {
    id: 2,
    name: "NLC Admin",
    email: "admin@nlc.in",
    mobile: "9000000000",
    nlc_employee_number: "NLC-ADMIN",
    aadhaar_number: "",
    is_admin: true,
  },
];

const HALLS = [
  ["Block-8 Community Hall", "Block-8", 220, "A welcoming hall for family celebrations and township gatherings.", "Stage, chairs and tables, restrooms, parking, basic AV support", "photo-1519167758481-83f550bb49b3"],
  ["Block-10 Community Hall", "Block-10", 350, "A spacious venue for weddings, receptions and community events.", "Stage, dining area, restrooms, parking, sound system, generator backup", "photo-1540575467063-178a50c2df87"],
  ["Block-16 Amaravathi Marriage Hall", "Block-16", 300, "A popular marriage hall designed for weddings and festive family events.", "Wedding stage, waiting lounge, restrooms, parking, decorative lighting", "photo-1511795409834-ef04bbd61622"],
  ["Block-19 Community Hall", "Block-19", 250, "A well-lit, mid-size hall with easy access from across the township.", "AC hall, kitchen annex, chairs and tables, parking, water facility", "photo-1464366400600-7168b8af9bc3"],
  ["Block-24 Community Hall", "Block-24", 260, "A flexible setting for family functions, meetings and social gatherings.", "Sound system, lighting, stage, seating, restrooms, parking", "photo-1469371670807-013ccf25f16a"],
  ["Block-26 Community Hall", "Block-26", 180, "A comfortable venue for birthdays and smaller community events.", "Open lawn, indoor hall, restrooms, two-wheeler parking", "photo-1492684223066-81342ee5ff30"],
  ["Block-27 Community Hall", "Block-27", 320, "A well-appointed hall for receptions and township celebrations.", "Stage, dining hall, waiting area, parking, AV and lighting", "photo-1505236858219-8359eb29e329"],
  ["Township Main Auditorium", "Central Township", 600, "The flagship venue for large cultural programmes and official events.", "Large stage, green rooms, AC, premium lighting, ample parking, security", "photo-1492684223066-81342ee5ff30"],
].map(([name, block, capacity, description, amenities, photo], index) => ({
  id: index + 1,
  name,
  block,
  capacity,
  description,
  amenities,
  cover_image: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1600&q=85`,
  is_active: true,
  images: [0, 1, 2].map((imageIndex) => ({
    id: index * 3 + imageIndex + 1,
    image_url: `https://images.unsplash.com/${["photo-1519167758481-83f550bb49b3", "photo-1464366400600-7168b8af9bc3", "photo-1511795409834-ef04bbd61622", "photo-1478146896981-b80fe463b330"][imageIndex]}?auto=format&fit=crop&w=1400&q=80`,
    caption: ["Hall interior", "Function setup", "Celebration arrangement"][imageIndex],
    sort_order: imageIndex,
  })),
}));

const FUNCTION_TYPES = [
  ["Wedding", "Marriage ceremony and related rituals"],
  ["Reception", "Wedding reception and family gatherings"],
  ["Birthday", "Birthday and family celebrations"],
  ["Cultural Programme", "Music, dance and township cultural events"],
  ["Official / Corporate", "Meetings, farewells and official functions"],
  ["Other", "Other community events"],
].map(([name, description], index) => ({ id: index + 1, name, description, is_active: true }));

const SLOT_TEMPLATES = [
  ["Morning", "06:00", "12:00"],
  ["Afternoon", "12:00", "18:00"],
  ["Evening", "18:00", "23:00"],
];

const FUNCTION_BASE_PRICES = [18000, 16000, 8000, 10000, 12000, 7000];

function makeInitialState() {
  const slots = HALLS.flatMap((hall) =>
    SLOT_TEMPLATES.map(([label, start_time, end_time], index) => ({
      id: (hall.id - 1) * SLOT_TEMPLATES.length + index + 1,
      hall_id: hall.id,
      label,
      start_time,
      end_time,
      is_active: true,
    }))
  );
  const prices = HALLS.flatMap((hall) =>
    FUNCTION_TYPES.flatMap((func) =>
      slots
        .filter((slot) => slot.hall_id === hall.id)
        .map((slot) => {
          const hallFactor = hall.name.includes("Auditorium") ? 1.4 : 1;
          const slotFactor = slot.label === "Evening" ? 1.25 : slot.label === "Morning" ? 0.9 : 1;
          return {
            id: `${hall.id}-${func.id}-${slot.id}`,
            hall_id: hall.id,
            function_type_id: func.id,
            time_slot_id: slot.id,
            amount_inr: Math.round(FUNCTION_BASE_PRICES[func.id - 1] * hallFactor * slotFactor),
            advance_percentage: 50,
          };
        })
    )
  );
  return {
    halls: HALLS,
    slots,
    prices,
    functions: FUNCTION_TYPES,
    blocks: [],
    users: DEMO_USERS,
    bookings: [],
    nextBookingId: 1,
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...makeInitialState(), ...JSON.parse(saved) };
  } catch (error) {
    console.warn("Could not read the saved NLC demo data. Starting a fresh demo.", error);
  }
  const initial = makeInitialState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function response(data) {
  return { data };
}

function fail(detail, status = 400) {
  const error = new Error(detail);
  error.response = { data: { detail }, status };
  throw error;
}

function routePath(path) {
  return path.split("?")[0].replace(/\/+$/, "") || "/";
}

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("nlc_user") || "null");
  } catch {
    return null;
  }
}

function asPlainObject(value) {
  if (value instanceof FormData) return Object.fromEntries(value.entries());
  return value || {};
}

function enrichBooking(booking) {
  const hall = state.halls.find((item) => item.id === booking.hall_id);
  const slot = state.slots.find((item) => item.id === booking.time_slot_id);
  const func = state.functions.find((item) => item.id === booking.function_type_id);
  return {
    ...booking,
    hall_name: hall?.name || "Community Hall",
    hall_block: hall?.block || "",
    time_slot: slot?.label || "",
    start_time: slot?.start_time || "",
    end_time: slot?.end_time || "",
    function_type: func?.name || "Community event",
  };
}

function getAvailability(params = {}) {
  return state.slots
    .filter((slot) => slot.hall_id === Number(params.hall_id) && slot.is_active)
    .map((slot) => {
      const booking = state.bookings.find(
        (item) =>
          item.hall_id === Number(params.hall_id) &&
          item.time_slot_id === slot.id &&
          item.booking_date === params.booking_date &&
          ["held", "confirmed", "function_completed", "settlement_completed"].includes(item.status)
      );
      const block = state.blocks.find(
        (item) =>
          item.hall_id === Number(params.hall_id) &&
          item.booking_date === params.booking_date &&
          (!item.time_slot_id || item.time_slot_id === slot.id)
      );
      return {
        ...slot,
        status: block || booking?.status === "confirmed" || booking?.status === "function_completed" || booking?.status === "settlement_completed"
          ? "booked"
          : booking?.status === "held"
            ? "held"
            : "available",
        hold_expires_at: booking?.hold_expires_at || null,
      };
    });
}

function priceQuote(payload) {
  const price = state.prices.find(
    (item) =>
      item.hall_id === Number(payload.hall_id) &&
      item.function_type_id === Number(payload.function_type_id) &&
      item.time_slot_id === Number(payload.time_slot_id)
  );
  if (!price) fail("No price is configured for this booking.");
  const refundable_advance = Math.round(price.amount_inr * price.advance_percentage / 100);
  return {
    amount_inr: price.amount_inr,
    advance_percentage: price.advance_percentage,
    refundable_advance,
    total_amount_inr: price.amount_inr + refundable_advance,
    hall_id: price.hall_id,
    function_type_id: price.function_type_id,
    time_slot_id: price.time_slot_id,
  };
}

function createBooking(payload) {
  const user = currentUser();
  if (!user) fail("Please sign in to reserve a hall.", 401);
  const date = String(payload.booking_date || "");
  const existing = getAvailability({ hall_id: payload.hall_id, booking_date: date })
    .find((slot) => slot.id === Number(payload.time_slot_id));
  if (!existing || existing.status !== "available") fail("This time slot is no longer available. Please choose another.");

  const quote = priceQuote(payload);
  const id = state.nextBookingId++;
  const booking = {
    id,
    user_id: user.id,
    hall_id: Number(payload.hall_id),
    function_type_id: Number(payload.function_type_id),
    time_slot_id: Number(payload.time_slot_id),
    booking_date: date,
    amount_inr: quote.amount_inr,
    refundable_advance: quote.refundable_advance,
    total_amount_inr: quote.total_amount_inr,
    number_of_guests: Number(payload.number_of_guests || 0),
    notes: payload.notes || "",
    status: "held",
    hold_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    payment_status: "created",
    razorpay_payment_id: null,
    electricity_bill: null,
    other_deductions: 0,
    refund_amount: null,
    settlement_status: "pending",
    refund_status: "pending",
    refund_date: null,
  };
  state.bookings.unshift(booking);
  saveState();
  return {
    booking_id: id,
    amount_inr: booking.amount_inr,
    refundable_advance: booking.refundable_advance,
    total_amount_inr: booking.total_amount_inr,
    status: "created",
    hold_expires_at: booking.hold_expires_at,
    razorpay_key_id: "",
    razorpay_order_id: `demo_order_${id}`,
    demo_mode: true,
  };
}

function galleryGroups() {
  return state.halls.map((hall) => ({
    hall_id: hall.id,
    hall_name: hall.name,
    block: hall.block,
    cover_image: hall.cover_image,
    images: hall.images || [],
  }));
}

function allPrices() {
  return state.prices.map((price) => ({
    ...price,
    hall_name: state.halls.find((hall) => hall.id === price.hall_id)?.name || "",
    function_name: state.functions.find((func) => func.id === price.function_type_id)?.name || "",
    slot_label: state.slots.find((slot) => slot.id === price.time_slot_id)?.label || "",
  }));
}

function get(path, config = {}) {
  const route = routePath(path);
  if (route === "/auth/me") {
    const user = currentUser();
    return response(user || fail("Please sign in to continue.", 401));
  }
  if (route === "/halls") return response(state.halls.filter((hall) => hall.is_active));
  if (route === "/function-types") return response(state.functions.filter((func) => func.is_active));
  if (route === "/gallery") return response(galleryGroups());
  if (route === "/availability") return response(getAvailability(config.params));
  if (route === "/bookings/mine") {
    const user = currentUser();
    return response(user ? state.bookings.filter((booking) => booking.user_id === user.id).map(enrichBooking) : []);
  }
  if (route === "/admin/halls") return response(state.halls);
  if (route === "/admin/slots") return response(state.slots);
  if (route === "/admin/prices") return response(allPrices());
  if (route === "/admin/function-types") return response(state.functions);
  if (route === "/admin/bookings") return response(state.bookings.map(enrichBooking));
  if (route === "/admin/blocks") return response(state.blocks);
  const documentMatch = route.match(/^\/auth\/documents\/(employee|aadhaar)$/);
  if (documentMatch) {
    const demoPdf = new Blob(["%PDF-1.1\n% NLC demo identity document\n%%EOF"], { type: "application/pdf" });
    return response(demoPdf);
  }
  return fail(`Demo API does not provide ${route}.`, 404);
}

function post(path, body = {}) {
  const route = routePath(path);
  const payload = asPlainObject(body);
  if (route === "/auth/login" || route === "/auth/register") {
    const email = String(payload.email || "").trim().toLowerCase();
    let user = state.users.find((item) => item.email.toLowerCase() === email);
    if (route === "/auth/register") {
      if (!payload.name || !email || !payload.mobile) fail("Enter your name, email and mobile number.");
      if (user) fail("An account with this email already exists.");
      user = {
        id: Math.max(0, ...state.users.map((item) => item.id)) + 1,
        name: String(payload.name),
        email,
        mobile: String(payload.mobile),
        nlc_employee_number: String(payload.nlc_employee_number || "DEMO-RESIDENT"),
        aadhaar_number: String(payload.aadhaar_number || ""),
        is_admin: false,
      };
      state.users.push(user);
      saveState();
    } else {
      const isBuiltInDemo = (email === "user@nlc.in" && payload.password === "user123") ||
        (email === "admin@nlc.in" && payload.password === "admin123");
      if (!user || (!isBuiltInDemo && user.id <= 2)) fail("Demo sign-in failed. Try user@nlc.in / user123 or admin@nlc.in / admin123.");
    }
    return response({ access_token: `demo_token_${user.id}`, token_type: "bearer", user });
  }
  if (route === "/bookings/hold") return response(createBooking(payload));
  if (route === "/bookings/verify") {
    const booking = state.bookings.find((item) => item.id === Number(payload.booking_id));
    if (!booking) fail("Booking not found.", 404);
    booking.status = "confirmed";
    booking.payment_status = "succeeded";
    booking.razorpay_payment_id = `demo_payment_${booking.id}`;
    saveState();
    return response(enrichBooking(booking));
  }
  if (/^\/bookings\/\d+\/cancel$/.test(route)) {
    const id = Number(route.split("/")[2]);
    const booking = state.bookings.find((item) => item.id === id);
    if (!booking) fail("Booking not found.", 404);
    booking.status = "cancelled";
    booking.payment_status = "cancelled";
    saveState();
    return response(enrichBooking(booking));
  }
  if (/^\/admin\/halls$/.test(route)) {
    const hall = { ...payload, id: Math.max(0, ...state.halls.map((item) => item.id)) + 1, images: [], is_active: true };
    state.halls.push(hall);
    for (const [index, [label, start_time, end_time]] of SLOT_TEMPLATES.entries()) {
      state.slots.push({ id: Math.max(0, ...state.slots.map((item) => item.id)) + 1, hall_id: hall.id, label, start_time, end_time, is_active: true });
    }
    saveState();
    return response(hall);
  }
  if (route === "/admin/slots") {
    const slot = { ...payload, id: Math.max(0, ...state.slots.map((item) => item.id)) + 1, is_active: true };
    state.slots.push(slot);
    saveState();
    return response(slot);
  }
  if (route === "/admin/prices") {
    const existing = state.prices.find((item) => item.hall_id === payload.hall_id && item.function_type_id === payload.function_type_id && item.time_slot_id === payload.time_slot_id);
    if (existing) Object.assign(existing, payload);
    else state.prices.push({ ...payload, id: `price-${Date.now()}` });
    saveState();
    return response(allPrices());
  }
  if (route === "/admin/function-types") {
    const func = { ...payload, id: Math.max(0, ...state.functions.map((item) => item.id)) + 1, is_active: true };
    state.functions.push(func);
    saveState();
    return response(func);
  }
  if (route === "/admin/blocks") {
    const block = { ...payload, id: Math.max(0, ...state.blocks.map((item) => item.id)) + 1 };
    state.blocks.push(block);
    saveState();
    return response(block);
  }
  const adminAction = route.match(/^\/admin\/bookings\/(\d+)\/(complete|settlement|refund)$/);
  if (adminAction) {
    const booking = state.bookings.find((item) => item.id === Number(adminAction[1]));
    if (!booking) fail("Booking not found.", 404);
    if (adminAction[2] === "complete") {
      booking.status = "function_completed";
      booking.function_completed_at = new Date().toISOString();
    } else if (adminAction[2] === "settlement") {
      booking.electricity_bill = Number(payload.electricity_bill || 0);
      booking.other_deductions = Number(payload.other_deductions || 0);
      booking.refund_amount = Math.max(0, booking.refundable_advance - booking.electricity_bill - booking.other_deductions);
      booking.settlement_status = "completed";
      booking.status = "settlement_completed";
    } else {
      booking.refund_status = "initiated";
      booking.refund_date = new Date().toISOString();
    }
    saveState();
    return response(enrichBooking(booking));
  }
  return fail(`Demo API does not provide ${route}.`, 404);
}

function patch(path, body = {}) {
  const route = routePath(path);
  const payload = body || {};
  const match = route.match(/^\/admin\/(halls|slots|bookings)\/(\d+)$/);
  if (!match) return fail(`Demo API does not provide ${route}.`, 404);
  const [, collection, idValue] = match;
  const id = Number(idValue);
  const item = collection === "halls"
    ? state.halls.find((entry) => entry.id === id)
    : collection === "slots"
      ? state.slots.find((entry) => entry.id === id)
      : state.bookings.find((entry) => entry.id === id);
  if (!item) fail("Item not found.", 404);
  Object.assign(item, payload);
  saveState();
  return response(collection === "bookings" ? enrichBooking(item) : item);
}

function remove(path) {
  const route = routePath(path);
  const holdMatch = route.match(/^\/bookings\/(\d+)\/hold$/);
  if (holdMatch) {
    const booking = state.bookings.find((item) => item.id === Number(holdMatch[1]));
    if (booking && booking.status === "held") {
      booking.status = "cancelled";
      booking.payment_status = "cancelled";
      saveState();
    }
    return response({ success: true });
  }
  const blockMatch = route.match(/^\/admin\/blocks\/(\d+)$/);
  if (blockMatch) {
    state.blocks = state.blocks.filter((item) => item.id !== Number(blockMatch[1]));
    saveState();
    return response({ success: true });
  }
  return fail(`Demo API does not provide ${route}.`, 404);
}

const api = {
  get: async (path, config) => get(path, config),
  post: async (path, body) => post(path, body),
  patch: async (path, body) => patch(path, body),
  delete: async (path) => remove(path),
};

export default api;
