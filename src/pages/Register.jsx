/**
 * Register page – standalone route at /register.
 * Collects account and NLC identity details, then calls AuthContext.register().
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        mobile: "",
        nlc_employee_number: "",
        aadhaar_number: "",
        password: "",
        confirm: "",
    });
    const [documents, setDocuments] = useState({ employee_card_pdf: null, aadhaar_card_pdf: null });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const onChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        // Client-side validation
        if (form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, ""))) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }
        if (form.aadhaar_number && !/^\d{12}$/.test(form.aadhaar_number.replace(/\D/g, ""))) {
            setError("Enter a valid 12-digit Aadhaar number.");
            return;
        }

        setBusy(true);
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                if (key !== "confirm") payload.append(key, value);
            });
            payload.set("mobile", form.mobile.replace(/\D/g, ""));
            payload.set("aadhaar_number", form.aadhaar_number.replace(/\D/g, ""));
            payload.append("employee_card_pdf", documents.employee_card_pdf);
            payload.append("aadhaar_card_pdf", documents.aadhaar_card_pdf);
            await register(payload);
            navigate("/book", { replace: true });
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : "Registration failed. Please check your details and try again."
            );
        } finally {
            setBusy(false);
        }
    };

    const fields = [
        { name: "name", label: "Full name", type: "text", placeholder: "John Doe", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", placeholder: "you@example.com", autoComplete: "email" },
        { name: "mobile", label: "Mobile number", type: "tel", placeholder: "9xxxxxxxxx", autoComplete: "tel" },
        { name: "nlc_employee_number", label: "NLC employee number", type: "text", placeholder: "Employee number", autoComplete: "off" },
        { name: "aadhaar_number", label: "Aadhaar number", type: "text", placeholder: "12-digit Aadhaar number", autoComplete: "off", inputMode: "numeric", maxLength: 12 },
        { name: "password", label: "Password", type: "password", placeholder: "Min. 6 characters", autoComplete: "new-password" },
        { name: "confirm", label: "Confirm password", type: "password", placeholder: "Re-enter password", autoComplete: "new-password" },
    ];

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
            <form
                onSubmit={submit}
                className="glass-card w-full max-w-md space-y-5 rounded-2xl p-8"
            >
                {/* Header */}
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">
                        NLC Community Hall
                    </p>
                    <h2 className="mt-1 text-3xl font-semibold">Create an account</h2>
                    <p className="mt-1 text-sm text-[#f6f3ea]/60">
                                Create a demo account to explore the complete booking experience.
                    </p>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label
                                htmlFor={field.name}
                                className="mb-1 block text-sm font-medium"
                            >
                                {field.label}
                            </label>
                            <input
                                id={field.name}
                                name={field.name}
                                type={field.type}
                                autoComplete={field.autoComplete}
                                required={["name", "email", "mobile", "password", "confirm"].includes(field.name)}
                                placeholder={field.placeholder}
                                inputMode={field.inputMode}
                                maxLength={field.maxLength}
                                value={form[field.name]}
                                onChange={onChange}
                                className="w-full rounded-md border border-white/10 bg-[#06201c] px-3 py-2 text-sm placeholder-[#f6f3ea]/30 focus:border-[#c9a227]/60 focus:outline-none"
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-medium">Identity documents <span className="font-normal text-white/50">(optional for this demo)</span></p>
                    {["employee_card_pdf", "aadhaar_card_pdf"].map((name) => (
                        <div key={name}>
                            <label htmlFor={name} className="mb-1 block text-sm text-[#f6f3ea]/75">
                                {name === "employee_card_pdf" ? "Employee card PDF" : "Aadhaar card PDF"}
                            </label>
                            <input
                                id={name}
                                name={name}
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={(event) => setDocuments((prev) => ({ ...prev, [name]: event.target.files?.[0] || null }))}
                                className="w-full rounded-md border border-white/10 bg-[#06201c] px-3 py-2 text-sm"
                            />
                        </div>
                    ))}
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
                    {busy ? "Creating account…" : "Create account"}
                </button>

                {/* Switch to login */}
                <p className="text-center text-sm text-[#f6f3ea]/60">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-[#c9a227] underline hover:text-[#e0b83a]"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}
