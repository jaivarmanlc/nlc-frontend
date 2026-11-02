import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="border-t border-[#c9a227]/20 bg-[#06201c]/90 backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid gap-8 sm:grid-cols-3">
                    {/* Brand */}
                    <div>
                        <p className="text-xs tracking-[0.3em] text-[#c9a227]">
                            NLC INDIA LIMITED
                        </p>
                        <h3 className="mt-1 text-base font-semibold">
                            Community Hall Booking
                        </h3>
                        <p className="mt-2 text-sm text-[#f6f3ea]/60">
                            Book NLC Township community halls for weddings, receptions, and
                            official events. This interactive presentation runs locally in your browser.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#c9a227]">
                            Quick Links
                        </h4>
                        <ul className="space-y-2 text-sm text-[#f6f3ea]/70">
                            <li>
                                <Link to="/" className="hover:text-[#c9a227] transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/gallery"
                                    className="hover:text-[#c9a227] transition-colors"
                                >
                                    Gallery
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/book"
                                    className="hover:text-[#c9a227] transition-colors"
                                >
                                    Book a Hall
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/bookings"
                                    className="hover:text-[#c9a227] transition-colors"
                                >
                                    My Bookings
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Halls */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#c9a227]">
                            Available Halls
                        </h4>
                        <ul className="space-y-2 text-sm text-[#f6f3ea]/70">
                            <li>Block-10 Community Hall</li>
                            <li>Block-19 Community Hall</li>
                            <li>Block-26 Community Hall</li>
                            <li>Township Main Auditorium</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 border-t border-[#c9a227]/15 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#f6f3ea]/50">
                    <p>© {new Date().getFullYear()} NLC India Limited. All rights reserved.</p>
                    <p>Interactive demo · Simulated checkout · No real transactions</p>
                </div>
            </div>
        </footer>
    );
}
