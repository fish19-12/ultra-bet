import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Gift,
  KeyRound,
  LoaderCircle,
  LogOut,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { apiRequest } from "../api";

const supportUrl = "https://t.me/+251921296982";
const amount = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Profile({ user, onClose, onUserChange, onLogout, onDeposit, onSupport }) {
  const [view, setView] = useState("overview");
  const [referrals, setReferrals] = useState(0);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const loadAccountData = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const requests = [
        apiRequest("/api/auth/me"),
        apiRequest("/api/auth/referrals"),
        apiRequest("/api/deposits/mine"),
      ];
      if (user?.role === "admin") requests.push(apiRequest("/api/deposits/admin/pending"));
      const results = await Promise.all(requests);
      onUserChange(results[0].user);
      localStorage.setItem("ultraBetUser", JSON.stringify(results[0].user));
      setReferrals(results[1].referrals);
      setRecentDeposits(results[2].deposits);
      if (results[3]) setPendingDeposits(results[3].deposits);
    } catch (error) {
      setMessage(error.message);
      if (error.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  }, [onLogout, onUserChange, user?.role]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  const copyReferral = async () => {
    const referralLink = `${window.location.origin}/?ref=${encodeURIComponent(user?.referralCode || "")}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("Could not copy the invite link. Please copy it from the field.");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (passwords.newPassword.length < 6) {
      setPasswordError("Use at least 6 characters for your new password.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await apiRequest("/api/auth/password", {
        method: "PATCH",
        body: JSON.stringify(passwords),
      });
      setPasswordSuccess(result.message);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const reviewDeposit = async (depositId, status) => {
    try {
      await apiRequest(`/api/deposits/${depositId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAccountData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const referralLink = `${window.location.origin}/?ref=${encodeURIComponent(user?.referralCode || "")}`;

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto bg-[#101222] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#111326]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={view === "overview" ? onClose : () => setView("overview")} className="flex items-center gap-2 text-sm font-bold text-white/65 hover:text-white">
            <ArrowLeft size={19} /> <span className="hidden sm:inline">{view === "overview" ? "Lobby" : "My profile"}</span>
          </button>
          <div className="flex items-center gap-2">
            <WalletCards size={18} className="text-[#f4bd38]" />
            <span className="text-sm font-black">{amount(user?.balance)} <span className="text-white/45">ETB</span></span>
            <button type="button" onClick={onDeposit} className="ml-1 rounded-xl bg-[#f4bd38] px-3 py-2 text-xs font-black text-[#17191f]">Deposit</button>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/35">Account</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-12 sm:px-6 sm:py-9">
        {view === "password" ? (
          <section className="mx-auto max-w-xl">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c18cff]">Account security</p>
              <h1 className="mt-2 text-3xl font-black">Change password</h1>
              <p className="mt-2 text-sm leading-6 text-white/45">Choose a password with at least 6 characters. Never share it with anyone.</p>
            </div>
            <form onSubmit={changePassword} className="space-y-4 rounded-3xl border border-white/[0.07] bg-[#191c30] p-5 sm:p-7">
              {[
                ["currentPassword", "Current password", undefined],
                ["newPassword", "New password", 6],
                ["confirmPassword", "Confirm new password", 6],
              ].map(([field, label, minLength]) => (
                <label key={field} className="block">
                  <span className="mb-2 block text-sm font-bold text-white/70">{label}</span>
                  <span className="auth-field h-[54px]">
                    <KeyRound size={18} />
                    <input
                      type="password"
                      autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                      minLength={minLength}
                      required
                      value={passwords[field]}
                      onChange={(event) => setPasswords((current) => ({ ...current, [field]: event.target.value }))}
                      placeholder={label}
                    />
                  </span>
                </label>
              ))}
              {passwordError ? <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100">{passwordError}</p> : null}
              {passwordSuccess ? <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm text-emerald-100"><CheckCircle2 size={17} />{passwordSuccess}</p> : null}
              <button type="submit" disabled={passwordSaving} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#f4bd38] font-black text-[#17191f] disabled:opacity-60">
                {passwordSaving ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {passwordSaving ? "Updating password..." : "Update password"}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#28213f] via-[#1c1e35] to-[#191b2e] p-5 sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-[#9f59ff]/10 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#f4bd38] to-[#d58d16] text-2xl font-black text-[#17191f] shadow-lg">
                    {(user?.firstName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-[#f4bd38]">Your account</p>
                    <h1 className="mt-1 truncate text-2xl font-black sm:text-3xl">Hi, {user?.firstName || "Player"}</h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-white/45"><Phone size={14} />{user?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs font-bold text-emerald-200 sm:self-auto">
                  <ShieldCheck size={15} /> {user?.status === "disabled" ? "Account disabled" : "Account active"}
                </div>
              </div>
            </section>

            {message ? <p role="alert" className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100">{message}</p> : null}

            <section className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
              <div className="rounded-[26px] border border-[#f4bd38]/15 bg-gradient-to-br from-[#312844] via-[#27213a] to-[#202238] p-5 sm:p-7">
                <div className="flex items-center gap-2 text-sm font-bold text-white/55"><WalletCards size={18} className="text-[#f4bd38]" /> Total available balance</div>
                <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{amount(user?.balance)} <span className="text-xl text-white/45">ETB</span></p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={onDeposit} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f4bd38] px-5 font-black text-[#17191f] shadow-[0_8px_24px_rgba(244,189,56,.15)] transition hover:bg-[#ffd45d]">
                    <CreditCardIcon /> Deposit funds
                  </button>
                  <button type="button" onClick={loadAccountData} disabled={loading} className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white/65 hover:text-white disabled:opacity-50">
                    {loading ? <LoaderCircle className="animate-spin" size={16} /> : <UserRound size={16} />} Refresh account
                  </button>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/40">Pending deposit requests are not included in your balance. Only approved payments are credited.</p>
              </div>

              <div className="rounded-[26px] border border-white/[0.07] bg-[#191c30] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#c18cff]">Invite friends</p>
                    <h2 className="mt-2 text-xl font-black">Your referral</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c18cff]/10 text-[#c18cff]"><Gift size={20} /></div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#22253a] px-3 py-3">
                  <span className="font-black tracking-[.12em] text-[#f4bd38]">{user?.referralCode || "—"}</span>
                  <button type="button" onClick={copyReferral} className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-bold">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Share link"}
                  </button>
                </div>
                <label className="mt-2 block">
                  <span className="sr-only">Referral link</span>
                  <input readOnly value={referralLink} className="w-full truncate rounded-lg bg-transparent px-1 py-2 text-xs text-white/35 outline-none" />
                </label>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/55"><Users size={16} /> <strong className="text-white">{referrals}</strong> successful sign-ups</div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[26px] border border-white/[0.07] bg-[#191c30] p-5 sm:p-6">
                <h2 className="text-lg font-black">Account details</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Info label="First name" value={user?.firstName} icon={<UserRound size={16} />} />
                  <Info label="Last name" value={user?.lastName} icon={<UserRound size={16} />} />
                  <Info label="Phone number" value={user?.phone} icon={<Phone size={16} />} />
                  <Info label="Account type" value={user?.role === "admin" ? "Administrator" : "Player"} icon={<ShieldCheck size={16} />} />
                </div>
                <button type="button" onClick={() => { setPasswordError(""); setPasswordSuccess(""); setView("password"); }} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-[#22253a] p-4 text-left transition hover:border-[#c18cff]/30">
                  <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c18cff]/10 text-[#c18cff]"><KeyRound size={17} /></span><span><span className="block text-sm font-bold">Change password</span><span className="mt-1 block text-xs text-white/40">Keep your account secure</span></span></span>
                  <ChevronRight size={18} className="text-white/35" />
                </button>
              </div>

              <div className="rounded-[26px] border border-white/[0.07] bg-[#191c30] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-lg font-black">Recent deposits</h2><p className="mt-1 text-xs text-white/40">Review status and payment history</p></div>
                  <button type="button" onClick={onDeposit} className="text-xs font-bold text-[#f4bd38]">Open wallet</button>
                </div>
                {loading ? <div className="mt-5 flex items-center gap-2 text-sm text-white/45"><LoaderCircle className="animate-spin" size={16} />Loading your account</div> : recentDeposits.length ? (
                  <div className="mt-4 space-y-3">
                    {recentDeposits.slice(0, 3).map((deposit) => (
                      <div key={deposit._id} className="flex items-center justify-between gap-3 rounded-xl bg-[#22253a] p-3">
                        <div><p className="text-sm font-bold">{amount(deposit.amount)} ETB</p><p className="mt-1 text-xs capitalize text-white/40">{deposit.paymentMethod} · {new Date(deposit.createdAt).toLocaleDateString()}</p></div>
                        <Status status={deposit.status} />
                      </div>
                    ))}
                  </div>
                ) : <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">No deposits yet. Your payment requests will appear here.</div>}
              </div>
            </section>

            {user?.role === "admin" ? (
              <section className="mt-5 rounded-[26px] border border-[#f4bd38]/15 bg-[#191c30] p-5 sm:p-6">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#f4bd38]">Operations</p><h2 className="mt-1 text-lg font-black">Deposit review</h2></div><span className="rounded-full bg-[#f4bd38]/10 px-3 py-1 text-xs font-bold text-[#f4bd38]">{pendingDeposits.length} pending</span></div>
                {pendingDeposits.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{pendingDeposits.map((deposit) => (
                  <article key={deposit._id} className="rounded-2xl border border-white/[0.06] bg-[#22253a] p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-black">{amount(deposit.amount)} ETB</p><p className="mt-1 text-xs text-white/45">{deposit.user?.firstName} {deposit.user?.lastName} · {deposit.user?.phone}</p></div><span className="text-xs capitalize text-amber-200">{deposit.paymentMethod}</span></div>
                    <a href={deposit.proofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#f4bd38]">View payment proof <ExternalLink size={13} /></a>
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => reviewDeposit(deposit._id, "approved")} className="flex-1 rounded-xl bg-emerald-400/15 py-2.5 text-xs font-bold text-emerald-200">Approve & credit</button><button type="button" onClick={() => reviewDeposit(deposit._id, "rejected")} className="flex-1 rounded-xl bg-rose-400/10 py-2.5 text-xs font-bold text-rose-200">Reject</button></div>
                  </article>
                ))}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">No deposits waiting for review.</p>}
              </section>
            ) : null}

            <section className="mt-5 flex flex-col gap-4 rounded-[26px] border border-white/[0.07] bg-[#191c30] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div><h2 className="font-black">Need a hand?</h2><p className="mt-1 text-sm text-white/45">Our support team can help with account and payment questions.</p></div>
              <a href={supportUrl} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#37aee2]/20 bg-[#37aee2]/[0.08] px-4 text-sm font-bold text-[#92d9f7]"><ExternalLink size={16} /> Telegram support</a>
            </section>

            <button type="button" onClick={onLogout} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/15 bg-gradient-to-r from-rose-400/[0.1] to-rose-400/[0.04] font-bold text-rose-200 transition hover:border-rose-300/30 hover:bg-rose-400/[0.12]">
              <LogOut size={18} /> Log out of Ultra Bet
            </button>
          </>
        )}
      </main>
    </div>
  );
}

function Info({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-[#22253a] p-3">
      <p className="flex items-center gap-2 text-[11px] font-semibold text-white/40">{icon}{label}</p>
      <p className="mt-2 truncate text-sm font-bold">{value || "—"}</p>
    </div>
  );
}

function Status({ status }) {
  const appearance = {
    pending: "bg-amber-300/10 text-amber-200",
    approved: "bg-emerald-300/10 text-emerald-200",
    rejected: "bg-rose-300/10 text-rose-200",
  }[status] || "bg-white/10 text-white/60";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${appearance}`}>{status}</span>;
}

function CreditCardIcon() {
  return <WalletCards size={18} />;
}
