import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
      navigate("/book");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Request failed. Check the form and try again.");
    }
  };

  return (
    <form onSubmit={submit} className="glass-card mx-auto max-w-md space-y-4 rounded-2xl p-6">
      <h2 className="text-3xl font-semibold">{isLogin ? "Login" : "Register"}</h2>
      <p className="text-sm text-[#f6f3ea]/75">
        Demo accounts: admin@nlc.in / admin123 and user@nlc.in / user123
      </p>
      {!isLogin && (
        <>
          <input name="name" placeholder="Full name" className="w-full rounded-md bg-[#06201c] p-2" value={form.name} onChange={onChange} required />
          <input name="mobile" placeholder="Mobile number" className="w-full rounded-md bg-[#06201c] p-2" value={form.mobile} onChange={onChange} required />
        </>
      )}
      <input name="email" type="email" placeholder="Email" className="w-full rounded-md bg-[#06201c] p-2" value={form.email} onChange={onChange} required />
      <input name="password" type="password" placeholder="Password" className="w-full rounded-md bg-[#06201c] p-2" value={form.password} onChange={onChange} required />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button className="w-full rounded-md bg-[#c9a227] py-2 font-semibold text-[#06201c]">
        {isLogin ? "Login" : "Create account"}
      </button>
      <button
        type="button"
        className="w-full text-sm text-[#c9a227]"
        onClick={() => navigate(isLogin ? "/register" : "/login")}
      >
        {isLogin ? "Need an account? Register" : "Already registered? Login"}
      </button>
    </form>
  );
}
