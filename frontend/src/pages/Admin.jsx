import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Gift,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { apiRequest } from "../api";

const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "deposits", label: "Deposits", icon: ArrowDownToLine },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { id: "users", label: "Players", icon: Users },
  { id: "referrals", label: "Referrals", icon: Gift },
];

const currency = (value) => `${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ETB`;

function readStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem("ultraBetAdminUser") || "null");
  } catch {
    return null;
  }
}

function AdminAuth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ identity: "", username: "", email: "", password: "", adminKey: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = await apiRequest(
        isRegister ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(isRegister
            ? {
                username: form.username,
                email: form.email,
                password: form.password,
                adminKey: form.adminKey,
              }
            : { identity: form.identity, password: form.password }),
        },
      );
      if (payload.user?.role !== "admin") {
        throw new Error("This sign-in is not linked to an admin account");
      }
      onAuthenticated(payload.token, payload.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0907] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-amber-700/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-orange-700/10 blur-3xl" />
      <section className="relative w-full max-w-[460px] rounded-[28px] border border-[#7c5b2b]/25 bg-[#17130f]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.55)] sm:p-9">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="Ultra Bet" className="h-14 max-w-[190px] object-contain" />
        </div>
        <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9973b]/20 bg-[#c9973b]/10 text-[#e2b55b]">
          <ShieldCheck size={23} />
        </div>
        <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[.22em] text-[#d3a454]">Secure control center</p>
        <h1 className="mt-2 text-center text-2xl font-black sm:text-3xl">{isRegister ? "Create admin account" : "Admin sign in"}</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-white/45">
          {isRegister
            ? "Register an authorized administrator with your server-provided secret code."
            : "Sign in to manage players, payment requests, and referral activity."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          {isRegister ? (
            <>
              <label className="admin-auth-field">
                <UserRound size={18} />
                <input required minLength={3} maxLength={30} autoComplete="username" value={form.username} onChange={update("username")} placeholder="Admin username" />
              </label>
              <label className="admin-auth-field">
                <Mail size={18} />
                <input required type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="Admin email" />
              </label>
            </>
          ) : (
            <label className="admin-auth-field">
              <UserRound size={18} />
              <input required autoComplete="username" value={form.identity} onChange={update("identity")} placeholder="Username or email" />
            </label>
          )}
          <label className="admin-auth-field">
            <LockKeyhole size={18} />
            <input required minLength={isRegister ? 8 : undefined} type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update("password")} placeholder="Password" />
          </label>
          {isRegister ? (
            <>
              <label className="admin-auth-field">
                <ShieldCheck size={18} />
                <input required type="password" autoComplete="off" value={form.adminKey} onChange={update("adminKey")} placeholder="Admin secret code" />
              </label>
              <p className="px-1 text-xs leading-5 text-white/40">The secret code is checked by the backend and is never stored in the browser.</p>
            </>
          ) : null}
          {error ? <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-100">{error}</p> : null}
          <button type="submit" disabled={loading} className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c98d2f] to-[#f4bd38] font-black text-[#17130d] shadow-[0_10px_26px_rgba(201,141,47,.18)] transition hover:brightness-110 disabled:opacity-60">
            {loading ? "Please wait..." : isRegister ? "Create admin account" : "Sign in to admin"}
            {!loading ? <ChevronRight size={18} /> : null}
          </button>
        </form>

        <div className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-white/50">
          {isRegister ? "Already have an admin account?" : "Need to set up an admin account?"}
          <button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }} className="ml-2 font-bold text-[#e2b55b]">
            {isRegister ? "Sign in" : "Create admin"}
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-white/30"><LockKeyhole size={12} /> Admin access is protected by your server secret.</p>
      </section>
    </main>
  );
}

function StatCard({ label, value, detail, icon, tone = "amber" }) {
  const tones = {
    amber: "border-amber-300/15 bg-amber-300/[0.07] text-amber-200",
    violet: "border-violet-300/15 bg-violet-300/[0.07] text-violet-200",
    emerald: "border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-200",
    blue: "border-sky-300/15 bg-sky-300/[0.07] text-sky-200",
  };
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#171a2b] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-white/45">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{value}</p>
      {detail ? <p className="mt-1 text-[11px] text-white/40">{detail}</p> : null}
    </article>
  );
}

function EmptyState({ children }) {
  return <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-white/45">{children}</div>;
}

function RequestCard({ item, type, onReview, busy }) {
  const userName = [item.user?.firstName, item.user?.lastName].filter(Boolean).join(" ") || "Player";
  const isDeposit = type === "deposit";
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#171a2b] p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{userName}</p>
            <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase text-amber-200">Pending review</span>
          </div>
          <p className="mt-1 text-xs text-white/45">{item.user?.phone || "No phone"} · {new Date(item.createdAt).toLocaleString()}</p>
          <p className="mt-3 text-2xl font-black">{currency(item.amount)}</p>
          <p className="mt-1 text-xs font-semibold capitalize text-white/50">{item.paymentMethod}</p>
          {!isDeposit ? (
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs leading-5 text-white/60">
              <span className="font-bold text-white/75">{item.accountName}</span><br />
              Payout destination: <span className="font-semibold text-white">{item.destination}</span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isDeposit && item.proofUrl ? (
            <a href={item.proofUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/75 hover:bg-white/[0.08]">
              View receipt
            </a>
          ) : null}
          <button type="button" disabled={busy} onClick={() => onReview(item, "rejected")} className="h-10 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-3 text-xs font-bold text-rose-200 hover:bg-rose-300/[0.12] disabled:opacity-50">
            {isDeposit ? "Reject" : "Reject & refund"}
          </button>
          <button type="button" disabled={busy} onClick={() => onReview(item, "approved")} className="h-10 rounded-xl bg-[#f4bd38] px-3 text-xs font-black text-[#17191f] hover:bg-[#ffd45d] disabled:opacity-50">
            {isDeposit ? "Approve & credit" : "Mark as paid"}
          </button>
        </div>
      </div>
    </article>
  );
}

function DataTable({ children, headers }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#171a2b]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-white/[0.025]">
            <tr>{headers.map((header) => <th key={header} className="border-b border-white/[0.07] px-4 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-white/40">{header}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDashboard({ admin, token, onLogout }) {
  const [section, setSection] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pages, setPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [
        apiRequest("/api/admin/summary", { authToken: token }),
        apiRequest("/api/deposits/admin/pending", { authToken: token }),
        apiRequest("/api/withdrawals/admin/pending", { authToken: token }),
      ];
      if (section === "users") {
        const params = new URLSearchParams({ page: String(page), limit: "50", search });
        requests.push(apiRequest(`/api/admin/users?${params}`, { authToken: token }));
      }
      if (section === "referrals") {
        requests.push(apiRequest("/api/admin/referrals", { authToken: token }));
      }

      const [summaryResult, depositResult, withdrawalResult, extraResult] = await Promise.all(requests);
      setSummary(summaryResult.summary);
      setDeposits(depositResult.deposits || []);
      setWithdrawals(withdrawalResult.withdrawals || []);
      if (section === "users") {
        setUsers(extraResult.users || []);
        setPages(extraResult.pages || 1);
        setTotalUsers(extraResult.total || 0);
      } else if (section === "referrals") {
        setReferrers(extraResult.referrers || []);
      }
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401 || requestError.status === 403) onLogout();
    } finally {
      setLoading(false);
    }
  }, [onLogout, page, search, section, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const requestReview = (item, status, type) => setReviewTarget({ item, status, type });

  const confirmReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    setError("");
    try {
      const route = reviewTarget.type === "deposit" ? "deposits" : "withdrawals";
      await apiRequest(`/api/${route}/${reviewTarget.item._id}/review`, {
        method: "PATCH",
        authToken: token,
        body: JSON.stringify({
          status: reviewTarget.status,
          adminNote: reviewTarget.status === "rejected" ? "Rejected in admin dashboard" : "",
        }),
      });
      setReviewTarget(null);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReviewing(false);
    }
  };

  const summaryCards = summary ? [
    { label: "Players", value: summary.players.toLocaleString(), detail: `${summary.referrals.toLocaleString()} referred sign-ups`, icon: <Users size={17} />, tone: "violet" },
    { label: "Player cash balance", value: currency(summary.cashBalance), detail: `Bonus balances: ${currency(summary.bonusBalance)}`, icon: <WalletCards size={17} />, tone: "amber" },
    { label: "Approved deposits", value: currency(summary.approvedDeposits), detail: "Credited to player cash balances", icon: <ArrowDownToLine size={17} />, tone: "emerald" },
    { label: "Payouts marked paid", value: currency(summary.paidWithdrawals), detail: "Admin-reviewed withdrawals", icon: <ArrowUpFromLine size={17} />, tone: "blue" },
    { label: "Pending deposits", value: summary.pendingDeposits.count.toLocaleString(), detail: currency(summary.pendingDeposits.amount) + " awaiting review", icon: <Clock3 size={17} />, tone: "amber" },
    { label: "Pending withdrawals", value: summary.pendingWithdrawals.count.toLocaleString(), detail: currency(summary.pendingWithdrawals.amount) + " awaiting review", icon: <CircleAlert size={17} />, tone: "violet" },
  ] : [];

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const heading = navigation.find((item) => item.id === section)?.label || "Overview";

  return (
    <div className="min-h-screen bg-[#0b0907] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen min-h-0 w-[250px] shrink-0 flex-col overflow-y-auto border-r border-[#806038]/15 bg-[#100d09] p-5 md:flex lg:w-[286px] lg:p-6">
          <div className="rounded-[22px] border border-[#8a683b]/20 bg-gradient-to-br from-[#292116] to-[#17120d] p-4">
            <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg">
              <img src="/logo.png" alt="Ultra Bet" className="h-full w-full object-contain" />
            </div>
            <p className="mt-4 text-base font-black">Ultra Bet</p>
            <p className="mt-0.5 text-sm text-white/45">Admin Panel</p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-400/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-white/65">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.65)]" /> Operations online
          </div>
          <p className="mb-3 mt-8 px-3 text-[10px] font-black uppercase tracking-[.2em] text-[#9a825f]">Management</p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              const pending = item.id === "deposits" ? deposits.length : item.id === "withdrawals" ? withdrawals.length : 0;
              return (
                <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`flex h-11 w-full items-center gap-3 rounded-xl border-l-2 px-3 text-left text-sm font-bold transition ${active ? "border-[#f4bd38] bg-gradient-to-r from-[#f4bd38]/10 to-transparent text-[#f4bd38]" : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white"}`}>
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {pending > 0 ? <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] text-rose-200">{pending}</span> : null}
                </button>
              );
            })}
          </nav>
          <div className="sticky bottom-0 z-10 mt-auto shrink-0 border-t border-[#806038]/15 bg-[#100d09] pt-3">
            <button type="button" onClick={onLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a74d12] to-[#c52720] text-sm font-black text-white shadow-lg hover:brightness-110"><LogOut size={16} /> Sign out</button>
            <div className="mt-3 min-w-0 px-1 pb-1">
              <p className="truncate text-sm font-bold">{admin.username}</p>
              <p className="mt-1 truncate text-xs text-white/40">{admin.email || "Admin account"}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#806038]/15 bg-[#0b0907]/95 backdrop-blur-xl">
            <div className="flex h-[78px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open admin sidebar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#806038]/20 bg-[#1a1510] text-[#e2b55b] hover:text-white md:hidden"><Menu size={19} /></button>
                <img src="/logo.png" alt="Ultra Bet" className="h-8 max-w-[110px] object-contain md:hidden" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a17a43]">Operations hub</p>
                  <h1 className="truncate text-base font-black sm:text-lg">{heading}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full border border-[#806038]/15 bg-[#211b12] px-3 py-2 text-xs font-bold text-[#e2b55b] sm:block">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="hidden items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/[0.08] px-3 py-2 text-xs font-bold text-emerald-300 lg:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> System stable</span>
                <span className="hidden items-center gap-2 rounded-xl border border-[#806038]/15 bg-[#17130e] py-1.5 pl-2 pr-3 lg:flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9973b]/15 text-xs font-black text-[#e2b55b]">{admin.username.charAt(0).toUpperCase()}</span>
                  <span className="max-w-24 truncate text-xs font-bold text-white/75">{admin.username}</span>
                </span>
                <button type="button" onClick={loadDashboard} disabled={loading} aria-label="Refresh dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#806038]/15 bg-[#17130e] text-white/55 hover:text-[#e2b55b] disabled:opacity-40"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
                <button type="button" onClick={onLogout} aria-label="Sign out" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#806038]/15 bg-[#17130e] text-white/55 hover:text-rose-200 md:hidden"><LogOut size={17} /></button>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 pb-12 sm:px-6 sm:py-7 lg:px-9">
            {section === "overview" ? (
              <section className="relative mb-5 overflow-hidden rounded-[26px] border border-[#8a683b]/25 bg-gradient-to-br from-[#241b10] via-[#17120d] to-[#10110f] p-5 sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#c9973b]/10 bg-[#c9973b]/[0.025]" />
                <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-[#c9973b]/10" />
                <div className="relative max-w-[680px]">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#e2b55b]"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Operations dashboard</p>
                  <h2 className="mt-4 text-[28px] font-black leading-tight tracking-tight sm:text-4xl">Welcome back, {admin.username}.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Your player activity, wallet reviews, and referral performance — all in one place.</p>
                </div>
                <div className="absolute bottom-5 right-6 hidden h-20 w-20 items-center justify-center rounded-full border border-[#c9973b]/15 bg-[#c9973b]/[0.06] text-[#d3a454] sm:flex">
                  <ShieldCheck size={34} strokeWidth={1.4} />
                </div>
              </section>
            ) : (
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a17a43]">Operations hub</p>
                <h2 className="mt-1 text-2xl font-black sm:text-3xl">{heading}</h2>
                <p className="mt-1 text-sm text-white/45">Manage {heading.toLowerCase()} for Ultra Bet.</p>
              </div>
            )}

            {mobileNavOpen ? (
              <div className="fixed inset-0 z-[70] flex md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
                <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close admin sidebar" className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                <aside className="relative flex h-full min-h-0 w-[min(84vw,310px)] flex-col overflow-y-auto border-r border-[#806038]/20 bg-[#100d09] p-5 shadow-2xl">
                  <div className="flex h-12 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white p-1"><img src="/logo.png" alt="" className="h-full w-full object-contain" /></div>
                      <span className="text-sm font-black">Ultra Bet Admin</span>
                    </div>
                    <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close admin sidebar" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#806038]/20 text-white/55"><X size={18} /></button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-full border border-emerald-400/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-white/65"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Operations online</div>
                  <p className="mb-3 mt-8 px-3 text-[10px] font-black uppercase tracking-[.2em] text-[#9a825f]">Management</p>
                  <nav className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const active = section === item.id;
                      const pending = item.id === "deposits" ? deposits.length : item.id === "withdrawals" ? withdrawals.length : 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { setSection(item.id); setMobileNavOpen(false); }}
                          className={`flex h-12 w-full items-center gap-3 rounded-xl border-l-2 px-3 text-left text-sm font-bold transition ${active ? "border-[#f4bd38] bg-gradient-to-r from-[#f4bd38]/10 to-transparent text-[#f4bd38]" : "border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white"}`}
                        >
                          <Icon size={18} />
                          <span className="flex-1">{item.label}</span>
                          {pending > 0 ? <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] text-rose-200">{pending}</span> : null}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="sticky bottom-0 z-10 mt-auto shrink-0 border-t border-[#806038]/15 bg-[#100d09] pt-3">
                    <button type="button" onClick={onLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#a74d12] to-[#c52720] text-sm font-black text-white shadow-lg hover:brightness-110"><LogOut size={16} /> Sign out</button>
                    <div className="mt-3 min-w-0 px-1 pb-1">
                      <p className="truncate text-sm font-bold">{admin.username}</p>
                      <p className="mt-1 truncate text-xs text-white/40">{admin.email || "Admin account"}</p>
                    </div>
                  </div>
                </aside>
              </div>
            ) : null}

            {error ? <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100"><CircleAlert className="mt-0.5 shrink-0" size={17} />{error}</div> : null}

            {section === "overview" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {summaryCards.map((card) => <StatCard key={card.label} {...card} />)}
                </div>
                <div className="mt-7 grid gap-5 xl:grid-cols-2">
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div><h3 className="font-black">Deposit review</h3><p className="mt-1 text-xs text-white/40">Verify receipts before crediting cash.</p></div>
                      <button type="button" onClick={() => setSection("deposits")} className="text-xs font-bold text-[#f4bd38]">View all</button>
                    </div>
                    {loading && !deposits.length ? <EmptyState>Loading deposit requests…</EmptyState> : deposits.length ? (
                      <div className="space-y-3">{deposits.slice(0, 3).map((item) => <RequestCard key={item._id} item={item} type="deposit" busy={reviewing} onReview={(request, status) => requestReview(request, status, "deposit")} />)}</div>
                    ) : <EmptyState>No deposits are waiting for review.</EmptyState>}
                  </section>
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div><h3 className="font-black">Withdrawal review</h3><p className="mt-1 text-xs text-white/40">Send the payout before marking it paid.</p></div>
                      <button type="button" onClick={() => setSection("withdrawals")} className="text-xs font-bold text-[#f4bd38]">View all</button>
                    </div>
                    {loading && !withdrawals.length ? <EmptyState>Loading withdrawal requests…</EmptyState> : withdrawals.length ? (
                      <div className="space-y-3">{withdrawals.slice(0, 3).map((item) => <RequestCard key={item._id} item={item} type="withdrawal" busy={reviewing} onReview={(request, status) => requestReview(request, status, "withdrawal")} />)}</div>
                    ) : <EmptyState>No withdrawals are waiting for review.</EmptyState>}
                  </section>
                </div>
              </>
            ) : null}

            {section === "deposits" ? (
              <section className="space-y-3">
                {loading && !deposits.length ? <EmptyState>Loading deposit requests…</EmptyState> : deposits.length ? deposits.map((item) => <RequestCard key={item._id} item={item} type="deposit" busy={reviewing} onReview={(request, status) => requestReview(request, status, "deposit")} />) : <EmptyState>No deposits are waiting for review.</EmptyState>}
              </section>
            ) : null}

            {section === "withdrawals" ? (
              <section className="space-y-3">
                {loading && !withdrawals.length ? <EmptyState>Loading withdrawal requests…</EmptyState> : withdrawals.length ? withdrawals.map((item) => <RequestCard key={item._id} item={item} type="withdrawal" busy={reviewing} onReview={(request, status) => requestReview(request, status, "withdrawal")} />) : <EmptyState>No withdrawals are waiting for review.</EmptyState>}
              </section>
            ) : null}

            {section === "users" ? (
              <section>
                <form onSubmit={submitSearch} className="mb-4 flex gap-2">
                  <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#171a2b] px-3 text-white/40">
                    <Search size={17} />
                    <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, phone, email, or username" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
                  </label>
                  <button type="submit" className="h-11 rounded-xl bg-[#f4bd38] px-4 text-xs font-black text-[#17191f]">Search</button>
                </form>
                <div className="mb-3 flex items-center justify-between text-xs text-white/45"><span>{totalUsers.toLocaleString()} player accounts</span><span>Player cash and bonus shown separately</span></div>
                {loading && !users.length ? <EmptyState>Loading player accounts…</EmptyState> : users.length ? (
                  <>
                    <DataTable headers={["Player", "Contact", "Cash balance", "Bonus balance", "Referral", "Joined"]}>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-white/[0.05] last:border-0">
                          <td className="px-4 py-3"><p className="text-sm font-bold">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Player"}</p><p className="mt-1 text-[11px] text-white/35">@{user.username}</p></td>
                          <td className="px-4 py-3 text-xs text-white/60"><span className="block">{user.phone || "—"}</span><span className="mt-1 block text-white/35">{user.email || "—"}</span></td>
                          <td className="px-4 py-3 text-xs font-bold">{currency(user.balance)}</td>
                          <td className="px-4 py-3 text-xs font-bold text-amber-200">{currency(user.bonusBalance)}</td>
                          <td className="px-4 py-3"><span className="block text-xs font-bold">{user.referralCount}</span><span className="mt-1 block text-[10px] text-white/35">{user.referralCode || "No code"}</span></td>
                          <td className="px-4 py-3 text-xs text-white/45">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </DataTable>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-white/40">Page {page} of {pages}</span>
                      <div className="flex gap-2">
                        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/60 disabled:opacity-30"><ChevronLeft size={15} />Previous</button>
                        <button type="button" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)} className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/60 disabled:opacity-30">Next<ChevronRight size={15} /></button>
                      </div>
                    </div>
                  </>
                ) : <EmptyState>No player accounts match this search.</EmptyState>}
              </section>
            ) : null}

            {section === "referrals" ? (
              <section>
                <div className="mb-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.05] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold"><Gift size={17} className="text-violet-200" /> Referral leaderboard</div>
                  <p className="mt-1 text-xs leading-5 text-white/45">Top referrers ranked by player sign-ups. Only recorded referral links are counted.</p>
                </div>
                {loading && !referrers.length ? <EmptyState>Loading referral activity…</EmptyState> : referrers.length ? (
                  <DataTable headers={["Rank", "Referrer", "Phone", "Referral code", "Successful sign-ups"]}>
                    {referrers.map((referrer, index) => (
                      <tr key={referrer.id} className="border-b border-white/[0.05] last:border-0">
                        <td className="px-4 py-3 text-sm font-black text-[#f4bd38]">#{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-bold">{[referrer.firstName, referrer.lastName].filter(Boolean).join(" ") || "Player"}</td>
                        <td className="px-4 py-3 text-xs text-white/55">{referrer.phone || "—"}</td>
                        <td className="px-4 py-3 text-xs font-bold tracking-wider text-violet-200">{referrer.referralCode || "—"}</td>
                        <td className="px-4 py-3 text-sm font-black">{referrer.referrals}</td>
                      </tr>
                    ))}
                  </DataTable>
                ) : <EmptyState>No referral sign-ups have been recorded yet.</EmptyState>}
              </section>
            ) : null}

            {loading ? <p className="mt-4 flex items-center gap-2 text-xs text-white/35"><RefreshCw size={13} className="animate-spin" /> Refreshing data…</p> : null}
          </main>
        </div>
      </div>

      {reviewTarget ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#181a2b] p-5 sm:rounded-3xl sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200"><CircleAlert size={20} /></div>
            <h2 id="review-title" className="mt-4 text-xl font-black">Confirm request review</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              {reviewTarget.type === "deposit"
                ? reviewTarget.status === "approved"
                  ? `Approving ${currency(reviewTarget.item.amount)} credits it to the player's cash balance. Verify the payment receipt first.`
                  : `Reject this ${currency(reviewTarget.item.amount)} deposit request? It will not be credited.`
                : reviewTarget.status === "approved"
                  ? `Only mark ${currency(reviewTarget.item.amount)} as paid after you have sent the payout manually.`
                  : `Reject this ${currency(reviewTarget.item.amount)} withdrawal? The reserved amount will be restored to the player's cash balance.`}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" disabled={reviewing} onClick={() => setReviewTarget(null)} className="h-11 rounded-xl border border-white/10 text-sm font-bold text-white/60">Cancel</button>
              <button type="button" disabled={reviewing} onClick={confirmReview} className="h-11 rounded-xl bg-[#f4bd38] text-sm font-black text-[#17191f] disabled:opacity-50">{reviewing ? "Saving…" : "Confirm"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("ultraBetAdminToken") || "");
  const [admin, setAdmin] = useState(readStoredAdmin);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem("ultraBetAdminToken")));

  const logout = useCallback(() => {
    localStorage.removeItem("ultraBetAdminToken");
    localStorage.removeItem("ultraBetAdminUser");
    setToken("");
    setAdmin(null);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest("/api/auth/me", { authToken: token })
      .then((payload) => {
        if (!active) return;
        if (payload.user?.role !== "admin") {
          throw new Error("This session is not an administrator account");
        }
        setAdmin(payload.user);
        localStorage.setItem("ultraBetAdminUser", JSON.stringify(payload.user));
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [logout, token]);

  const authenticate = (adminToken, user) => {
    localStorage.setItem("ultraBetAdminToken", adminToken);
    localStorage.setItem("ultraBetAdminUser", JSON.stringify(user));
    setAdmin(user);
    setToken(adminToken);
    setChecking(true);
  };

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-[#0d0f1b] text-sm font-bold text-white/50"><RefreshCw size={17} className="mr-2 animate-spin" /> Checking admin access…</main>;
  }
  if (!token || !admin) return <AdminAuth onAuthenticated={authenticate} />;
  return <AdminDashboard admin={admin} token={token} onLogout={logout} />;
}
