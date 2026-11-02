/**
 * Login page – standalone route at /login.
 * Redirects to /book on success, or back to the previous page if a `from` location exists.
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/book";

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const onChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            await login({ email: form.email, password: form.password });
            navigate(from, { replace: true });
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : "Login failed. Check your email and password."
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <form
                onSubmit={submit}
                className="glass-card w-full max-w-md space-y-5 rounded-2xl p-8"
            >
                {/* Header */}
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">
                        NLC Community Hall
                    </p>
                    <h2 className="mt-1 text-3xl font-semibold">Welcome back</h2>
                    <p className="mt-1 text-sm text-[#f6f3ea]/60">
                        Demo accounts:&nbsp;
                        <span className="font-mono text-[#c9a227]/80">admin@nlc.in / admin123</span>
                        &nbsp;or&nbsp;
                        <span className="font-mono text-[#c9a227]/80">user@nlc.in / user123</span>
                    </p>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={form.email}
                            onChange={onChange}
                            placeholder="you@example.com"
                            className="w-full rounded-md border border-white/10 bg-[#06201c] px-3 py-2 text-sm placeholder-[#f6f3ea]/30 focus:border-[#c9a227]/60 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={form.password}
                            onChange={onChange}
                            placeholder="••••••••"
                            className="w-full rounded-md border border-white/10 bg-[#06201c] px-3 py-2 text-sm placeholder-[#f6f3ea]/30 focus:border-[#c9a227]/60 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <p className="rounded-md bg-rose-500/15 px-3 py-2 text-sm text-rose-300">
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-md bg-[#c9a227] py-2.5 font-semibold text-[#06201c] transition-colors hover:bg-[#e0b83a] disabled:opacity-50"
                >
                    {busy ? "Logging in…" : "Login"}
                </button>

                {/* Switch to register */}
                <p className="text-center text-sm text-[#f6f3ea]/60">
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        className="text-[#c9a227] underline hover:text-[#e0b83a]"
                    >
                        Register here
                    </Link>
                </p>
            </form>
        </div>
    );
}
