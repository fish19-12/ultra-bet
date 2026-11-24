import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  Banknote,
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
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0e1a] px-4 py-10 text-white">
      <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      <section className="relative w-full max-w-[460px] rounded-[28px] border border-white/[0.08] bg-[#171a2a]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,.45)] sm:p-9">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="Ultra Bet" className="h-14 max-w-[190px] object-contain" />
        </div>
        <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f4bd38]/15 bg-[#f4bd38]/10 text-[#f4bd38]">
          <ShieldCheck size={23} />
        </div>
        <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[.22em] text-[#c18cff]">Secure control center</p>
        <h1 className="mt-2 text-center text-2xl font-black sm:text-3xl">{isRegister ? "Create admin account" : "Admin sign in"}</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-white/45">
          {isRegister
            ? "Register an authorized administrator with your server-provided secret code."
            : "Sign in to manage players, payment requests, and referral activity."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          {isRegister ? (
            <>
              <label className="auth-field">
                <UserRound size={18} />
                <input required minLength={3} maxLength={30} autoComplete="username" value={form.username} onChange={update("username")} placeholder="Admin username" />
              </label>
              <label className="auth-field">
                <Mail size={18} />
                <input required type="email" autoComplete="email" value={form.email} onChange={update("email")} placeholder="Admin email" />
              </label>
            </>
          ) : (
            <label className="auth-field">
              <UserRound size={18} />
              <input required autoComplete="username" value={form.identity} onChange={update("identity")} placeholder="Username or email" />
            </label>
          )}
          <label className="auth-field">
            <LockKeyhole size={18} />
            <input required minLength={isRegister ? 8 : undefined} type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update("password")} placeholder="Password" />
          </label>
          {isRegister ? (
            <>
              <label className="auth-field">
                <ShieldCheck size={18} />
                <input required type="password" autoComplete="off" value={form.adminKey} onChange={update("adminKey")} placeholder="Admin secret code" />
              </label>
              <p className="px-1 text-xs leading-5 text-white/40">The secret code is checked by the backend and is never stored in the browser.</p>
            </>
          ) : null}
          {error ? <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-4 py-3 text-sm text-rose-100">{error}</p> : null}
          <button type="submit" disabled={loading} className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#f4bd38] font-black text-[#17191f] shadow-[0_10px_26px_rgba(244,189,56,.14)] transition hover:bg-[#ffd45d] disabled:opacity-60">
            {loading ? "Please wait..." : isRegister ? "Create admin account" : "Sign in to admin"}
            {!loading ? <ChevronRight size={18} /> : null}
          </button>
        </form>

        <div className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-white/50">
          {isRegister ? "Already have an admin account?" : "Need to set up an admin account?"}
          <button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); }} className="ml-2 font-bold text-[#f4bd38]">
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
    <div className="min-h-screen bg-[#0d0f1b] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/[0.06] bg-[#111321] p-5 lg:flex">
          <div className="flex h-12 items-center px-2">
            <img src="/logo.png" alt="Ultra Bet" className="h-10 max-w-[150px] object-contain" />
          </div>
          <p className="mb-3 mt-9 px-3 text-[10px] font-black uppercase tracking-[.2em] text-white/30">Management</p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              const pending = item.id === "deposits" ? deposits.length : item.id === "withdrawals" ? withdrawals.length : 0;
              return (
                <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${active ? "bg-[#f4bd38]/10 text-[#f4bd38]" : "text-white/50 hover:bg-white/[0.04] hover:text-white"}`}>
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {pending > 0 ? <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-[10px] text-rose-200">{pending}</span> : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="truncate text-sm font-bold">{admin.username}</p>
            <p className="mt-1 truncate text-xs text-white/40">{admin.email || "Admin account"}</p>
            <button type="button" onClick={onLogout} className="mt-3 flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white"><LogOut size={15} /> Sign out</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0d0f1b]/95 backdrop-blur-xl">
            <div className="flex h-[66px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <img src="/logo.png" alt="Ultra Bet" className="h-8 max-w-[110px] object-contain lg:hidden" />
                <div className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#f4bd38]/15 bg-[#f4bd38]/10 text-[#f4bd38] sm:flex lg:hidden"><ShieldCheck size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#c18cff]">Ultra Bet admin</p>
                  <h1 className="truncate text-sm font-black sm:text-base">{heading}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-right sm:block"><span className="block text-xs font-bold">{admin.username}</span><span className="block text-[10px] text-white/40">Administrator</span></span>
                <button type="button" onClick={loadDashboard} disabled={loading} aria-label="Refresh dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white disabled:opacity-40"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
                <button type="button" onClick={onLogout} aria-label="Sign out" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-rose-200 lg:hidden"><LogOut size={17} /></button>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:hidden">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${section === item.id ? "bg-[#f4bd38] text-[#17191f]" : "bg-white/[0.04] text-white/55"}`}>
                    <Icon size={15} />{item.label}
                  </button>
                );
              })}
            </nav>
          </header>

          <main className="px-4 py-5 pb-12 sm:px-6 sm:py-7 lg:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#c18cff]">Control center</p>
                <h2 className="mt-1 text-2xl font-black sm:text-3xl">{section === "overview" ? "Welcome back" : heading}</h2>
                <p className="mt-1 text-sm text-white/40">{section === "overview" ? "Monitor player activity and review wallet requests." : `Manage ${heading.toLowerCase()} for Ultra Bet.`}</p>
              </div>
              {section === "overview" ? <span className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-1.5 text-[10px] font-bold text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Admin session active</span> : null}
            </div>

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
