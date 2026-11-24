import { useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Gift, LockKeyhole, Phone, UserRound } from "lucide-react";
import { apiRequest } from "../api";

const initialSignup = {
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
  confirmPassword: "",
  referralCode: new URLSearchParams(window.location.search).get("ref") || "",
};

export default function Auth({ mode, onSuccess, onSwitch, onClose }) {
  const isSignup = mode === "signup";
  const [signup, setSignup] = useState(initialSignup);
  const [login, setLogin] = useState({ phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [screen, setScreen] = useState("form");
  const [pendingSignup, setPendingSignup] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");

  const updateSignup = (field) => (event) => {
    setSignup((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (screen === "signupOtp") {
      if (!/^\d{6}$/.test(otpCode)) {
        setError("Enter the 6-digit code sent to your phone");
        return;
      }
      setLoading(true);
      try {
        const verified = await apiRequest("/api/auth/player/verify-phone", {
          method: "POST",
          body: JSON.stringify({ phone: pendingSignup.phone, code: otpCode }),
        });
        const auth = {
          token: verified.token || pendingSignup.auth.token,
          user: verified.user || pendingSignup.auth.user,
        };
        localStorage.setItem("ultraBetToken", auth.token);
        localStorage.setItem("ultraBetUser", JSON.stringify(auth.user));
        setSuccess({
          ...auth,
          title: "Registration successful!",
          description: "Your phone number is verified and your Ultra Bet account is ready.",
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (screen === "forgot") {
      const phone = login.phone.trim();
      if (phone.replace(/\D/g, "").length < 8) {
        setError("Enter your phone number first");
        return;
      }
      setLoading(true);
      try {
        const response = await apiRequest("/api/auth/player/forgot-password", {
          method: "POST",
          body: JSON.stringify({ phone }),
        });
        setNotice(response.message);
        setScreen("resetOtp");
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (screen === "resetOtp") {
      if (!/^\d{6}$/.test(otpCode)) {
        setError("Enter the 6-digit code sent to your phone");
        return;
      }
      if (resetPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (resetPassword !== resetConfirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setLoading(true);
      try {
        const response = await apiRequest("/api/auth/player/reset-password", {
          method: "POST",
          body: JSON.stringify({
            phone: login.phone.trim(),
            code: otpCode,
            password: resetPassword,
            confirmPassword: resetConfirmPassword,
          }),
        });
        setLogin((current) => ({ ...current, password: "" }));
        setOtpCode("");
        setResetPassword("");
        setResetConfirmPassword("");
        setNotice(response.message);
        setScreen("form");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSignup && (!signup.firstName.trim() || !signup.lastName.trim())) {
      setError("Enter your first and last name");
      return;
    }
    if (values.phone.replace(/\D/g, "").length < 8) {
      setError("Enter a valid phone number");
      return;
    }
    if (values.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
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

      if (isSignup) {
        setPendingSignup({ phone: payload.user.phone, auth: { token: payload.token, user: payload.user } });
        setOtpCode("");
        setScreen("signupOtp");
        setNotice(`We sent a verification code to ${payload.user.phone}.`);
        return;
      }
      localStorage.setItem("ultraBetToken", payload.token);
      localStorage.setItem("ultraBetUser", JSON.stringify(payload.user));
      setSuccess({
        token: payload.token,
        user: payload.user,
        title: "Welcome back!",
        description: "You have signed in successfully.",
      });
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

  if (success) {
    return (
      <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#090a12]/80 backdrop-blur-md sm:items-center sm:p-5">
        <div className="w-full rounded-t-[28px] border border-white/[0.08] bg-[#171a2b] px-6 pb-9 pt-8 text-center shadow-[0_-20px_70px_rgba(0,0,0,.42)] sm:max-w-[430px] sm:rounded-[28px] sm:px-9 sm:py-10">
          <img src="/logo.png" alt="Ultra Bet" className="mx-auto h-14 max-w-[180px] object-contain" />
          <div className="mx-auto mt-8 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/20">
            <Check size={38} strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-2xl font-black">{success.title}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/50">{success.description}</p>
          <button
            type="button"
            onClick={() => onSuccess(success.user)}
            className="mt-7 h-[52px] w-full rounded-xl bg-[#f4bd38] font-black text-[#17191f] shadow-[0_10px_24px_rgba(244,189,56,.16)]"
          >
            Continue to Ultra Bet
          </button>
        </div>
      </div>
    );
  }

  if (screen === "signupOtp" || screen === "resetOtp") {
    const isSignupOtp = screen === "signupOtp";
    const resendSignupCode = async () => {
      setError("");
      setLoading(true);
      try {
        const response = await apiRequest("/api/auth/player/resend-verification", {
          method: "POST",
          body: JSON.stringify({ phone: pendingSignup.phone }),
        });
        setNotice(response.message);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[#090a12]/80 backdrop-blur-md sm:items-center sm:p-5">
        <div className="relative w-full rounded-t-[28px] border border-white/[0.08] bg-[#171a2b] px-5 pb-8 pt-7 shadow-[0_-20px_70px_rgba(0,0,0,.42)] sm:max-w-[470px] sm:rounded-[28px] sm:p-8">
          <button type="button" onClick={onClose} className="absolute right-5 top-5 hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white sm:flex" aria-label="Close">×</button>
          <img src="/logo.png" alt="Ultra Bet" className="mx-auto h-14 max-w-[180px] object-contain" />
          <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4bd38]/10 text-[#f4bd38]"><Phone size={25} /></div>
          <h1 className="mt-5 text-center text-2xl font-black">{isSignupOtp ? "Verify your phone" : "Reset your password"}</h1>
          <p className="mt-2 text-center text-sm leading-6 text-white/50">
            {isSignupOtp ? `We sent an OTP to ${pendingSignup.phone}. Enter it below to verify your number.` : `Enter the OTP sent to ${login.phone}, then choose a new password.`}
          </p>
          {notice ? <p className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-4 py-3 text-center text-sm text-emerald-200">{notice}</p> : null}
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="auth-field">
              <Phone size={18} />
              <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit OTP" />
            </label>
            {!isSignupOtp ? (
              <>
                <label className="auth-field">
                  <LockKeyhole size={18} />
                  <input required minLength={6} type="password" autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} placeholder="New password" />
                </label>
                <label className="auth-field">
                  <LockKeyhole size={18} />
                  <input required minLength={6} type="password" autoComplete="new-password" value={resetConfirmPassword} onChange={(event) => setResetConfirmPassword(event.target.value)} placeholder="Confirm new password" />
                </label>
              </>
            ) : null}
            {error ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
            <button type="submit" disabled={loading} className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#f4bd38] font-black text-[#17191f] disabled:opacity-60">
              {loading ? "Please wait..." : isSignupOtp ? "Verify and continue" : "Reset password"}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {isSignupOtp ? (
              <>
                <button type="button" disabled={loading} onClick={resendSignupCode} className="font-bold text-[#f4bd38] disabled:opacity-50">Resend OTP</button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("ultraBetToken", pendingSignup.auth.token);
                    localStorage.setItem("ultraBetUser", JSON.stringify(pendingSignup.auth.user));
                    setSuccess({ ...pendingSignup.auth, title: "Registration successful!", description: "Your Ultra Bet account is ready. You can verify your phone later from your account." });
                  }}
                  className="font-bold text-white/60 hover:text-white"
                >
                  Skip for now
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setScreen("form"); setError(""); setNotice(""); }} className="font-bold text-[#f4bd38]">Back to login</button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="mt-5 text-center text-2xl font-black">{screen === "forgot" ? "Forgot password" : isSignup ? "Create an account" : "Welcome back"}</h1>
        <p className="mt-2 text-center text-sm text-white/45">
          {screen === "forgot" ? "Enter your registered phone number to receive a reset code." : isSignup ? "Join Ultra Bet in less than a minute" : "Log in to continue"}
        </p>

        {notice ? <p className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-4 py-3 text-center text-sm text-emerald-200">{notice}</p> : null}
        <form onSubmit={submit} className="mt-6 space-y-3">
          {isSignup ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="auth-field">
                <UserRound size={18} />
                <input required value={values.firstName} onChange={setValue("firstName")} placeholder="First Name" autoComplete="given-name" maxLength={50} />
              </label>
              <label className="auth-field">
                <UserRound size={18} />
                <input required value={values.lastName} onChange={setValue("lastName")} placeholder="Last Name" autoComplete="family-name" maxLength={50} />
              </label>
            </div>
          ) : null}

          <label className="auth-field">
            <Phone size={18} />
            <input required value={values.phone} onChange={setValue("phone")} placeholder="Phone Number" inputMode="tel" autoComplete="tel" maxLength={20} />
          </label>

          {screen !== "forgot" ? (
            <label className="auth-field">
              <LockKeyhole size={18} />
              <input required minLength={6} value={values.password} onChange={setValue("password")} type={showPassword ? "text" : "password"} placeholder="Password" autoComplete={isSignup ? "new-password" : "current-password"} />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="ml-auto text-white/40" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
          ) : null}

          {isSignup ? (
            <>
              <label className="auth-field">
                <LockKeyhole size={18} />
                <input required minLength={6} value={values.confirmPassword} onChange={setValue("confirmPassword")} type={showPassword ? "text" : "password"} placeholder="Confirm Password" autoComplete="new-password" />
              </label>
              <label className="auth-field">
                <Gift size={18} />
                <input value={values.referralCode} onChange={setValue("referralCode")} placeholder="Referral Code (Optional)" autoCapitalize="characters" />
              </label>
            </>
          ) : null}
          {isSignup ? <p className="px-1 text-xs text-white/40">Use at least 6 characters for your password.</p> : null}

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>
          ) : null}

          <button type="submit" disabled={loading} className="mt-2 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#f4bd38] font-black text-[#17191f] shadow-[0_10px_24px_rgba(244,189,56,.16)] disabled:opacity-60">
            {loading ? "Please wait..." : screen === "forgot" ? "Send reset code" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        {screen === "forgot" ? (
          <button type="button" onClick={() => { setScreen("form"); setError(""); setNotice(""); }} className="mt-5 block w-full text-center text-sm font-bold text-[#f4bd38]">
            Back to login
          </button>
        ) : !isSignup ? (
          <button type="button" onClick={() => { setScreen("forgot"); setError(""); setNotice(""); }} className="mt-4 block w-full text-center text-sm font-bold text-[#f4bd38]">
            Forgot password?
          </button>
        ) : null}

        {screen === "form" ? <p className="mt-5 text-center text-sm text-white/55">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <button type="button" onClick={onSwitch} className="ml-2 font-bold text-[#f4bd38]">
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p> : null}
      </div>
    </div>
  );
}
