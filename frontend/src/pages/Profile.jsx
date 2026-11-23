import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Gift, LogOut, Phone, Save, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { apiRequest } from "../api";

export default function Profile({ user, onClose, onUserChange, onLogout }) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName }),
      });
      localStorage.setItem("ultraBetUser", JSON.stringify(payload.user));
      onUserChange(payload.user);
      setMessage("Profile updated successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyReferral = async () => {
    if (!user?.referralCode) return;
    await navigator.clipboard?.writeText(user.referralCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-[#090a12]/75 backdrop-blur-md sm:items-center sm:p-5">
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-[#171a2b] pb-8 sm:max-w-[520px] sm:rounded-[28px]">
        <div className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-white/[0.06] bg-[#171a2b]/95 px-5 backdrop-blur">
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70" aria-label="Close">
            <ArrowLeft size={19} />
          </button>
          <h1 className="text-lg font-black">My Profile</h1>
          <button type="button" onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/15 text-red-300" aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#1d2034] p-4">
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-[#f4bd38] to-[#d58d16] text-2xl font-black text-[#17191f]">
              {(firstName || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black">{firstName} {lastName}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-white/45"><Phone size={14} />{user?.phone}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                <ShieldCheck size={13} /> Verified account
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#f4bd38]/10 bg-[#24243a] p-4">
              <WalletCards size={20} className="text-[#f4bd38]" />
              <p className="mt-3 text-xs text-white/45">Balance</p>
              <p className="mt-1 text-lg font-black">{Number(user?.balance || 0).toFixed(2)} ETB</p>
            </div>
            <button type="button" onClick={copyReferral} className="rounded-2xl border border-white/[0.06] bg-[#24243a] p-4 text-left">
              <Gift size={20} className="text-[#c18cff]" />
              <p className="mt-3 text-xs text-white/45">Referral code</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-black text-[#f4bd38]">{user?.referralCode || "None"} <Copy size={13} /></p>
              {copied ? <span className="mt-1 block text-[10px] text-emerald-300">Copied!</span> : null}
            </button>
          </div>

          <form onSubmit={saveProfile} className="mt-5 space-y-3">
            <h3 className="text-sm font-bold text-white/70">Personal information</h3>
            <label className="auth-field">
              <UserRound size={18} />
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First Name" />
            </label>
            <label className="auth-field">
              <UserRound size={18} />
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last Name" />
            </label>
            <label className="auth-field opacity-70">
              <Phone size={18} />
              <input value={user?.phone || ""} readOnly />
            </label>

            {message ? <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm text-white/70">{message}</div> : null}

            <button type="submit" disabled={saving} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#f4bd38] font-black text-[#17191f] disabled:opacity-60">
              <Save size={18} /> {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
