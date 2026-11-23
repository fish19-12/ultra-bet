import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Gift, LockKeyhole, Phone, UserRound } from "lucide-react";
import { apiRequest } from "../api";

const initialSignup = {
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
};

export default function Auth({ mode, onSuccess, onSwitch, onClose }) {
  const isSignup = mode === "signup";
  const [signup, setSignup] = useState(initialSignup);
  const [login, setLogin] = useState({ phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateSignup = (field) => (event) => {
    setSignup((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (isSignup && signup.password !== signup.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload = isSignup
        ? await apiRequest("/api/auth/signup", {
            method: "POST",
            body: JSON.stringify(signup),
          })
        : await apiRequest("/api/auth/player/login", {
            method: "POST",
            body: JSON.stringify(login),
          });

      localStorage.setItem("ultraBetToken", payload.token);
      localStorage.setItem("ultraBetUser", JSON.stringify(payload.user));
      onSuccess(payload.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const values = isSignup ? signup : login;
  const setValue = isSignup
    ? updateSignup
    : (field) => (event) => setLogin((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#090a12]/75 backdrop-blur-md sm:items-center sm:p-5">
      <button type="button" onClick={onClose} className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#171a2b] text-white/70 sm:hidden" aria-label="Close">
        <ArrowLeft size={20} />
      </button>

      <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-[#171a2b] px-5 pb-8 pt-6 shadow-[0_-20px_70px_rgba(0,0,0,.42)] sm:max-w-[470px] sm:rounded-[28px] sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white sm:flex" aria-label="Close">
          ×
        </button>

        <img src="/logo.png" alt="Ultra Bet" className="mx-auto h-14 max-w-[180px] object-contain" />
        <h1 className="mt-5 text-center text-2xl font-black">{isSignup ? "Create an account" : "Welcome back"}</h1>
        <p className="mt-2 text-center text-sm text-white/45">
          {isSignup ? "Join Ultra Bet in less than a minute" : "Log in to continue"}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {isSignup ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="auth-field">
                <UserRound size={18} />
                <input value={values.firstName} onChange={setValue("firstName")} placeholder="First Name" autoComplete="given-name" />
              </label>
              <label className="auth-field">
                <UserRound size={18} />
                <input value={values.lastName} onChange={setValue("lastName")} placeholder="Last Name" autoComplete="family-name" />
              </label>
            </div>
          ) : null}

          <label className="auth-field">
            <Phone size={18} />
            <input value={values.phone} onChange={setValue("phone")} placeholder="Phone Number" inputMode="tel" autoComplete="tel" />
          </label>

          <label className="auth-field">
            <LockKeyhole size={18} />
            <input value={values.password} onChange={setValue("password")} type={showPassword ? "text" : "password"} placeholder="Password" autoComplete={isSignup ? "new-password" : "current-password"} />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="ml-auto text-white/40" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {isSignup ? (
            <>
              <label className="auth-field">
                <LockKeyhole size={18} />
                <input value={values.confirmPassword} onChange={setValue("confirmPassword")} type={showPassword ? "text" : "password"} placeholder="Confirm Password" autoComplete="new-password" />
              </label>
              <label className="auth-field">
                <Gift size={18} />
                <input value={values.referralCode} onChange={setValue("referralCode")} placeholder="Referral Code (Optional)" autoCapitalize="characters" />
              </label>
            </>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <button type="submit" disabled={loading} className="mt-2 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#f4bd38] font-black text-[#17191f] shadow-[0_10px_24px_rgba(244,189,56,.16)] disabled:opacity-60">
            {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/55">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button type="button" onClick={onSwitch} className="ml-2 font-bold text-[#f4bd38]">
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
