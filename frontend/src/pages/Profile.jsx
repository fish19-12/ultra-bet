import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CircleHelp,
  ExternalLink,
  FileText,
  Gift,
  Headset,
  KeyRound,
  LoaderCircle,
  LogOut,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import { apiRequest } from "../api";

const supportUrl = "https://t.me/+251921296982";
const amount = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Profile({ user, onClose, onUserChange, onLogout, onDeposit, onWithdraw }) {
  const [view, setView] = useState("overview");
  const [referrals, setReferrals] = useState(0);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
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
        apiRequest("/api/withdrawals/mine"),
      ];
      if (user?.role === "admin") {
        requests.push(apiRequest("/api/deposits/admin/pending"));
        requests.push(apiRequest("/api/withdrawals/admin/pending"));
      }
      const results = await Promise.all(requests);
      onUserChange(results[0].user);
      localStorage.setItem("ultraBetUser", JSON.stringify(results[0].user));
      setReferrals(results[1].referrals);
      setRecentDeposits(results[2].deposits);
      setRecentWithdrawals(results[3].withdrawals);
      if (results[4]) setPendingDeposits(results[4].deposits);
      if (results[5]) setPendingWithdrawals(results[5].withdrawals);
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

  const reviewWithdrawal = async (withdrawalId, status) => {
    try {
      await apiRequest(`/api/withdrawals/${withdrawalId}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAccountData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const referralLink = `${window.location.origin}/?ref=${encodeURIComponent(user?.referralCode || "")}`;
  const transactions = [
    ...recentDeposits.map((item) => ({ ...item, transactionType: "deposit" })),
    ...recentWithdrawals.map((item) => ({ ...item, transactionType: "withdrawal" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto bg-[#101222] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#111326]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between gap-3 px-3 sm:px-6">
          <button type="button" onClick={view === "overview" ? onClose : () => setView("overview")} className="flex items-center gap-2 text-sm font-bold text-white/65 hover:text-white">
            <ArrowLeft size={19} /> <span>{view === "overview" ? "Lobby" : "Back"}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs font-black sm:flex"><WalletCards size={16} className="text-[#f4bd38]" />{amount(user?.balance)} ETB</span>
            <button type="button" onClick={onDeposit} className="rounded-lg bg-[#f4bd38] px-3 py-2 text-xs font-black text-[#17191f]">Deposit</button>
          </div>
          <span className="max-w-[72px] truncate text-xs font-bold text-white/50 sm:max-w-none">{view === "overview" ? "Profile" : ({ password: "Security", details: "Personal details", transactions: "Transactions", terms: "Terms", support: "Support" }[view])}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-4 pb-10 sm:px-6 sm:py-6">
        {view === "password" ? (
          <section className="mx-auto max-w-xl">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c18cff]">Account security</p>
              <h1 className="mt-1 text-2xl font-black">Change password</h1>
              <p className="mt-1 text-sm leading-5 text-white/45">Use at least 6 characters. Never share your password.</p>
            </div>
            <form onSubmit={changePassword} className="space-y-3 rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-6">
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
        ) : view === "details" ? (
          <section className="mx-auto max-w-2xl">
            <PageHeading eyebrow="Your account" title="Personal details" description="The information currently linked to your Ultra Bet account." />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="First name" value={user?.firstName} icon={<UserRound size={16} />} />
              <Info label="Last name" value={user?.lastName} icon={<UserRound size={16} />} />
              <Info label="Phone number" value={user?.phone} icon={<Phone size={16} />} />
              <Info label="Account type" value={user?.role === "admin" ? "Administrator" : "Player"} icon={<ShieldCheck size={16} />} />
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#191c30] p-4 text-sm text-white/45">
              Account status: <strong className="text-emerald-200">{user?.status === "disabled" ? "Disabled" : "Active"}</strong>
            </div>
          </section>
        ) : view === "transactions" ? (
          <section className="mx-auto max-w-3xl">
            <PageHeading eyebrow="Wallet" title="Transaction history" description="Deposit and withdrawal requests with their latest review status." />
            {loading ? <LoadingLine /> : transactions.length ? (
              <div className="mt-4 space-y-3">
                {transactions.map((deposit) => (
                  <article key={`${deposit.transactionType}-${deposit._id}`} className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4bd38]/10 text-[#f4bd38]"><ReceiptText size={19} /></span>
                      <div><p className="font-bold">{amount(deposit.amount)} ETB {deposit.transactionType}</p><p className="mt-1 text-xs capitalize text-white/40">{deposit.paymentMethod} · {new Date(deposit.createdAt).toLocaleString()}</p></div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end"><Status status={deposit.status} />{deposit.adminNote ? <span className="max-w-48 text-xs text-white/40">{deposit.adminNote}</span> : null}</div>
                  </article>
                ))}
              </div>
            ) : <EmptyState text="No transaction activity yet." />}
            <button type="button" onClick={onDeposit} className="mt-4 rounded-xl bg-[#f4bd38] px-4 py-3 text-sm font-black text-[#17191f]">Open wallet</button>
          </section>
        ) : view === "terms" ? (
          <section className="mx-auto max-w-3xl">
            <PageHeading eyebrow="Ultra Bet" title="Terms & conditions" description="Please review these platform notes before using your account." />
            <div className="mt-4 space-y-3">
              {[
                ["Account security", "You are responsible for keeping your password and account access private. Contact support if you believe someone else accessed your account."],
                ["Deposits and balance", "A deposit request remains pending until an administrator checks the payment proof. Funds are added only after approval. Never send money to an account number that differs from the details shown in the deposit screen."],
                ["Sports and game previews", "Sports fixtures and odds currently shown are demonstrations only. They are not live data, and no real bet can be placed or settled through these demo markets."],
                ["Responsible use", "Only use betting-related services if you meet the legal age and local requirements where you live. Set limits and seek help if gambling stops being enjoyable."],
                ["Updates", "These terms may be updated as Ultra Bet features and operating requirements change. Check this page for the latest version."],
              ].map(([title, description], index) => (
                <article key={title} className="rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-5">
                  <h2 className="font-bold"><span className="mr-2 text-[#f4bd38]">0{index + 1}</span>{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : view === "support" ? (
          <section className="mx-auto max-w-2xl">
            <PageHeading eyebrow="We're here to help" title="Customer support" description="Contact Ultra Bet support about account access, deposits, or your profile." />
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-[#191c30] p-5 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#37aee2]/10 text-[#92d9f7]"><Headset size={23} /></div>
              <h2 className="mt-4 text-lg font-black">Telegram support</h2>
              <p className="mt-1 text-sm text-white/45">Support contact: 0921296982</p>
              <a href={supportUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#37aee2] px-4 text-sm font-black text-[#0c1a22]"><ExternalLink size={16} /> Open Telegram</a>
            </div>
            <div className="mt-3 rounded-2xl border border-white/[0.07] bg-[#191c30] p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold"><CircleHelp size={17} className="text-[#f4bd38]" /> Before contacting support</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">For a deposit request, include the amount, payment method, and the date you submitted it. Do not send your password or one-time codes.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#28213f] via-[#1c1e35] to-[#191b2e] p-4 sm:p-5">
              <div className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full bg-[#9f59ff]/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4bd38] to-[#d58d16] text-lg font-black text-[#17191f] shadow-lg">
                    {(user?.firstName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#f4bd38]">Your account</p>
                    <h1 className="mt-0.5 truncate text-lg font-black sm:text-xl">Hi, {user?.firstName || "Player"}</h1>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45"><Phone size={12} />{user?.phone}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-emerald-200">
                  <ShieldCheck size={13} /> {user?.status === "disabled" ? "Disabled" : "Active"}
                </div>
              </div>
            </section>

            {message ? <p role="alert" className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-100">{message}</p> : null}

            <section className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-2xl border border-[#f4bd38]/15 bg-gradient-to-br from-[#312844] via-[#27213a] to-[#202238] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-white/55"><WalletCards size={16} className="text-[#f4bd38]" /> Total available balance</div>
                <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{amount(user?.balance)} <span className="text-base text-white/45">ETB</span></p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={onDeposit} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f4bd38] px-4 text-sm font-black text-[#17191f] shadow-[0_8px_24px_rgba(244,189,56,.15)] transition hover:bg-[#ffd45d]">
                    <CreditCardIcon /> Deposit funds
                  </button>
                  <button type="button" onClick={onWithdraw} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white/70 hover:text-white">
                    <WalletCards size={16} /> Withdraw
                  </button>
                  <button type="button" onClick={loadAccountData} disabled={loading} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/55 hover:text-white disabled:opacity-50">
                    {loading ? <LoaderCircle className="animate-spin" size={14} /> : <UserRound size={14} />} Refresh
                  </button>
                </div>
                <p className="mt-3 text-[11px] leading-4 text-white/40">Pending deposits are credited only after review. Pending withdrawals are reserved from your available balance.</p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-[#c18cff]">Invite friends</p>
                    <h2 className="mt-1 text-lg font-black">Your referral</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c18cff]/10 text-[#c18cff]"><Gift size={20} /></div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#22253a] px-3 py-2.5">
                  <span className="font-black tracking-[.12em] text-[#f4bd38]">{user?.referralCode || "—"}</span>
                  <button type="button" onClick={copyReferral} className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-bold">
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Share link"}
                  </button>
                </div>
                <label className="mt-2 block">
                  <span className="sr-only">Referral link</span>
                  <input readOnly value={referralLink} className="w-full truncate rounded-lg bg-transparent px-1 py-2 text-xs text-white/35 outline-none" />
                </label>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/55"><Users size={15} /> <strong className="text-white">{referrals}</strong> successful sign-ups</div>
              </div>
            </section>

            <section className="mt-3 rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-black text-white/80">Account & help</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <PageButton icon={<UserRound size={17} />} title="Personal details" detail="Name, phone and account type" onClick={() => setView("details")} />
                <PageButton icon={<ReceiptText size={17} />} title="Transaction history" detail="View deposits and withdrawals" onClick={() => setView("transactions")} />
                <PageButton icon={<WalletCards size={17} />} title="Withdraw funds" detail="Request a Telebirr or CBE payout" onClick={onWithdraw} />
                <PageButton icon={<KeyRound size={17} />} title="Change password" detail="Update your sign-in password" onClick={() => { setPasswordError(""); setPasswordSuccess(""); setView("password"); }} />
                <PageButton icon={<FileText size={17} />} title="Terms & conditions" detail="Platform terms and responsible use" onClick={() => setView("terms")} />
                <PageButton icon={<Headset size={17} />} title="Customer support" detail="Contact Ultra Bet on Telegram" onClick={() => setView("support")} />
              </div>
            </section>

            {user?.role === "admin" ? (
              <section className="mt-3 rounded-2xl border border-[#f4bd38]/15 bg-[#191c30] p-4 sm:p-5">
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

            {user?.role === "admin" ? (
              <section className="mt-3 rounded-2xl border border-[#c18cff]/15 bg-[#191c30] p-4 sm:p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#c18cff]">Payouts</p><h2 className="mt-1 text-lg font-black">Withdrawal review</h2></div><span className="rounded-full bg-[#c18cff]/10 px-3 py-1 text-xs font-bold text-[#d9b8ff]">{pendingWithdrawals.length} pending</span></div>
                {pendingWithdrawals.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{pendingWithdrawals.map((withdrawal) => (
                  <article key={withdrawal._id} className="rounded-xl border border-white/[0.06] bg-[#22253a] p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-black">{amount(withdrawal.amount)} ETB</p><p className="mt-1 text-xs text-white/45">{withdrawal.user?.firstName} {withdrawal.user?.lastName} · {withdrawal.user?.phone}</p></div><span className="text-xs capitalize text-amber-200">{withdrawal.paymentMethod}</span></div>
                    <p className="mt-3 text-xs text-white/60">{withdrawal.accountName} · {withdrawal.destination}</p>
                    <p className="mt-1 text-[10px] text-white/35">Mark paid only after the external payout is sent.</p>
                    <div className="mt-4 flex gap-2"><button type="button" onClick={() => reviewWithdrawal(withdrawal._id, "approved")} className="flex-1 rounded-xl bg-emerald-400/15 py-2.5 text-xs font-bold text-emerald-200">Mark as paid</button><button type="button" onClick={() => reviewWithdrawal(withdrawal._id, "rejected")} className="flex-1 rounded-xl bg-rose-400/10 py-2.5 text-xs font-bold text-rose-200">Reject & refund</button></div>
                  </article>
                ))}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/40">No withdrawals waiting for review.</p>}
              </section>
            ) : null}

            <button type="button" onClick={onLogout} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-300/15 bg-gradient-to-r from-rose-400/[0.1] to-rose-400/[0.04] text-sm font-bold text-rose-200 transition hover:border-rose-300/30 hover:bg-rose-400/[0.12]">
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

function PageHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f4bd38]">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h1>
      <p className="mt-1.5 max-w-xl text-sm leading-5 text-white/45">{description}</p>
    </div>
  );
}

function PageButton({ icon, title, detail, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[66px] items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#22253a] p-3 text-left transition hover:border-[#f4bd38]/25 hover:bg-[#262941]">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4bd38]/10 text-[#f4bd38]">{icon}</span>
        <span className="min-w-0"><span className="block truncate text-xs font-bold sm:text-sm">{title}</span><span className="mt-1 block truncate text-[10px] text-white/40">{detail}</span></span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-white/30" />
    </button>
  );
}

function LoadingLine() {
  return <div className="mt-4 flex items-center gap-2 text-sm text-white/45"><LoaderCircle className="animate-spin" size={16} />Loading your activity</div>;
}

function EmptyState({ text }) {
  return <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">{text}</div>;
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
