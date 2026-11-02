import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
        ? "bg-[#c9a227] text-[#06201c]"
        : "text-[#f6f3ea] hover:bg-white/10"
    }`;

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-20 border-b border-[#c9a227]/30 bg-[#06201c]/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                {/* Brand */}
                <button className="group flex items-center gap-3 text-left" onClick={() => navigate("/")}>
                    <img
                        src="/logo2.png"
                        alt="NLC India Limited logo"
                        className="h-20 w-auto object-contain sm:h-24"
                    />
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.25em] text-[#c9a227] group-hover:text-[#e0b83a] transition-colors sm:text-[11px]">
                            NLC INDIA LIMITED
                        </p>
                        <h1 className="text-lg font-semibold leading-tight text-[#f6f3ea] sm:text-xl">
                            Community Hall Booking
                        </h1>
                    </div>
                </button>

                {/* Navigation links */}
                <nav className="flex flex-wrap items-center gap-1">
                    <NavLink to="/" className={linkClass} end>
                        Home
                    </NavLink>
                    <NavLink to="/gallery" className={linkClass}>
                        Gallery
                    </NavLink>
                    <NavLink to="/book" className={linkClass}>
                        Book a Hall
                    </NavLink>
                    {user && (
                        <NavLink to="/bookings" className={linkClass}>
                            My Bookings
                        </NavLink>
                    )}
                    {user?.is_admin && (
                        <NavLink to="/admin" className={linkClass}>
                            Admin
                        </NavLink>
                    )}

                    {user ? (
                        <div className="ml-2 flex items-center gap-2">
                            <span className="hidden text-sm text-[#f6f3ea]/70 sm:inline">
                                {user.name}
                            </span>
                            <button
                                className="rounded-md border border-[#c9a227]/50 px-3 py-2 text-sm hover:bg-[#c9a227]/10 transition-colors"
                                onClick={() => {
                                    logout();
                                    navigate("/");
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <NavLink to="/login" className={linkClass}>
                                Login
                            </NavLink>
                            <NavLink
                                to="/register"
                                className="ml-1 rounded-md bg-[#c9a227] px-3 py-2 text-sm font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors"
                            >
                                Register
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
