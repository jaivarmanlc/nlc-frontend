import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const featureItems = [
  {
    icon: "🏛️",
    title: "Four Township Halls",
    desc: "Block-10, Block-19, Block-26, and the Central Auditorium — each with distinct capacities and amenities.",
  },
  {
    icon: "📅",
    title: "Real-Time Availability",
    desc: "Slots show as Available, Temporarily Held, or Booked so you never face a double-booking surprise.",
  },
  {
    icon: "💳",
    title: "Simulated Checkout",
    desc: "Walk through a realistic payment screen and confirm a demo reservation — no real money is charged.",
  },
  {
    icon: "🔒",
    title: "10-Minute Hold",
    desc: "Your slot is locked for 10 minutes while you pay, released automatically if payment is abandoned.",
  },
];

export default function Home() {
  const [halls, setHalls] = useState([]);

  useEffect(() => {
    api.get("/halls").then(({ data }) => setHalls(data)).catch(() => { });
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0d2b29]/60 shadow-2xl shadow-black/20">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            src="/nlc-30.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(7,23,20,0.56),rgba(7,23,20,0.78))]" />
        </div>

        <div className="relative z-10 p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">
            Neyveli Township
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            Book NLC Community Halls for weddings, receptions &amp; township events
          </h2>
          <p className="mt-4 max-w-2xl text-[#f6f3ea]/75 leading-relaxed">
            Explore halls, choose a date and time, see a sample quote, and
            complete a simulated checkout. Everything in this presentation runs
            in your browser, with demo reservations saved locally on this device.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/book"
              className="rounded-md bg-[#c9a227] px-6 py-2.5 font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors"
            >
              Reserve a slot
            </Link>
            <Link
              to="/gallery"
              className="rounded-md border border-[#c9a227]/50 bg-white/5 px-6 py-2.5 hover:bg-white/10 transition-colors"
            >
              View gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featureItems.map((item) => (
          <div key={item.title} className="glass-card rounded-2xl p-5 space-y-2">
            <p className="text-3xl">{item.icon}</p>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-[#f6f3ea]/65 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Hall cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Available halls</h2>
          <Link
            to="/book"
            className="text-sm text-[#c9a227] hover:underline"
          >
            Book now →
          </Link>
        </div>

        {halls.length === 0 && (
          <p className="glass-card rounded-2xl p-6 text-[#f6f3ea]/50">
            Loading halls…
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {halls.map((hall) => (
            <article
              key={hall.id}
              className="glass-card group overflow-hidden rounded-2xl transition-shadow hover:shadow-xl hover:shadow-black/30"
            >
              <div className="overflow-hidden">
                <img
                  src={hall.cover_image}
                  alt={hall.name}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2 p-5">
                <p className="text-xs uppercase tracking-widest text-[#c9a227]">
                  {hall.block}
                </p>
                <h3 className="text-xl font-semibold">{hall.name}</h3>
                <p className="text-sm text-[#f6f3ea]/75 leading-relaxed line-clamp-2">
                  {hall.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-[#f6f3ea]/60">
                    👥 Capacity: {hall.capacity} guests
                  </span>
                </div>
                <p className="text-xs text-[#f6f3ea]/50 leading-relaxed">
                  {hall.amenities}
                </p>
                <div className="pt-2">
                  <Link
                    to={`/book?hall=${hall.id}`}
                    className="inline-block rounded-md border border-[#c9a227]/40 px-4 py-1.5 text-sm hover:bg-[#c9a227]/10 transition-colors"
                  >
                    Check availability
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="glass-card rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-2xl font-semibold">Ready to book your event?</h3>
        <p className="text-[#f6f3ea]/65">
          Select your hall, pick a date, and complete the demo payment in under
          two minutes.
        </p>
        <Link
          to="/register"
          className="inline-block rounded-md bg-[#c9a227] px-8 py-3 font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors"
        >
          Get started — it's free
        </Link>
      </section>
    </div>
  );
}
