import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Layout() {
  return (
    <div className="relative z-0 min-h-screen flex flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <video
          className="h-full w-full object-cover"
          src="/nlc-30.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,32,28,0.72),rgba(8,24,22,0.86))]" />
      </div>

      <div className="relative z-10">
        <Navbar />
      </div>
      <div className="relative z-10 mx-auto mt-4 w-full max-w-6xl px-4">
        <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-950/60 px-4 py-2 text-center text-xs text-emerald-100/80 sm:text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          Interactive demo · Runs entirely in your browser · No real payments
        </div>
      </div>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
