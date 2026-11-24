import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, Landmark, LoaderCircle, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { apiRequest } from "../api";

const methods = [
  { id: "telebirr", label: "Telebirr", icon: Smartphone, placeholder: "Telebirr phone number" },
  { id: "cbe", label: "CBE", icon: Landmark, placeholder: "CBE account number" },
];

export default function Withdraw({ user, onClose, onSupport, onUserChange }) {
  const [paymentMethod, setPaymentMethod] = useState("telebirr");
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [destination, setDestination] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const method = methods.find((item) => item.id === paymentMethod);
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 50 && numericAmount <= Number(user?.balance || 0);

  useEffect(() => {
    let active = true;
    apiRequest("/api/withdrawals/mine")
      .then((payload) => {
        if (active) setHistory(payload.withdrawals || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!validAmount) {
      setError(Number(user?.balance || 0) < 50
        ? "You need at least 50 ETB available to request a withdrawal."
        : "Enter an amount between 50 ETB and your available balance.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = await apiRequest("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: numericAmount, paymentMethod, accountName, destination }),
      });
      setHistory((current) => [payload.withdrawal, ...current]);
      setSuccess(payload.message);
      setAmount("");
      setAccountName("");
      setDestination("");
      const updatedUser = {
        ...user,
        balance: Number(user?.balance || 0) - numericAmount,
      };
      localStorage.setItem("ultraBetUser", JSON.stringify(updatedUser));
      onUserChange(updatedUser);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[82] overflow-y-auto bg-[#101222] text-white">
      <header className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#111326]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-white/65 hover:text-white"><ArrowLeft size={18} /><span className="hidden sm:inline">Back to wallet</span></button>
          <h1 className="text-sm font-black sm:text-base">Withdraw funds</h1>
          <button type="button" onClick={onSupport} className="text-xs font-bold text-[#f4bd38]">Support</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-4 pb-10 sm:px-6 sm:py-6 lg:grid-cols-[1.05fr_.95fr]">
        <section>
          <div className="rounded-2xl border border-[#f4bd38]/15 bg-gradient-to-br from-[#312844] to-[#202238] p-4 sm:p-5">
            <p className="flex items-center gap-2 text-xs font-bold text-white/50"><WalletCards size={16} className="text-[#f4bd38]" /> Available balance</p>
            <p className="mt-2 text-2xl font-black">{Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-white/45">ETB</span></p>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-5">
            <div>
              <h2 className="font-black">Payout details</h2>
              <p className="mt-1 text-xs text-white/40">Minimum withdrawal: 50 ETB</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((item) => {
                const Icon = item.icon;
                const active = paymentMethod === item.id;
                return (
                  <button key={item.id} type="button" onClick={() => setPaymentMethod(item.id)} className={`flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${active ? "border-[#f4bd38]/40 bg-[#f4bd38]/[0.08] text-[#f4bd38]" : "border-white/[0.07] bg-[#22253a] text-white/55"}`}>
                    <Icon size={17} />{item.label}
                  </button>
                );
              })}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-white/60">Account holder name</span>
              <input required maxLength={100} value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Name on the receiving account" className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#22253a] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4bd38]/40" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-white/60">{method.label} destination</span>
              <input required maxLength={40} value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={method.placeholder} className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#22253a] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4bd38]/40" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-white/60">Amount (ETB)</span>
              <input required type="number" min="50" max={user?.balance || 0} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="50.00 or more" className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#22253a] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4bd38]/40" />
            </label>
            <div className="flex items-start gap-2 rounded-xl border border-amber-200/10 bg-amber-200/[0.05] p-3 text-xs leading-5 text-amber-100/70">
              <ShieldCheck className="mt-0.5 shrink-0 text-amber-200" size={15} />
              The requested amount is reserved from your available balance while pending. Rejected requests restore the amount. Approved requests are marked paid after manual review.
            </div>
            {error ? <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/[0.06] p-3 text-sm text-rose-100">{error}</p> : null}
            {success ? <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3 text-sm text-emerald-100"><CheckCircle2 size={16} />{success}</p> : null}
            <button type="submit" disabled={submitting || !validAmount} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f4bd38] text-sm font-black text-[#17191f] disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? <LoaderCircle className="animate-spin" size={18} /> : <WalletCards size={17} />}
              {submitting ? "Submitting request..." : "Request withdrawal"}
            </button>
          </form>
        </section>

        <aside className="rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div><h2 className="font-black">Withdrawal history</h2><p className="mt-1 text-xs text-white/40">Status of your payout requests</p></div>
            <Clock3 size={18} className="text-white/35" />
          </div>
          {loadingHistory ? <div className="flex min-h-32 items-center justify-center text-sm text-white/45"><LoaderCircle className="mr-2 animate-spin" size={17} />Loading</div> : history.length ? (
            <div className="mt-4 space-y-2.5">
              {history.map((item) => (
                <article key={item._id} className="rounded-xl border border-white/[0.06] bg-[#22253a] p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-sm font-bold">{Number(item.amount).toLocaleString()} ETB</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${item.status === "approved" ? "bg-emerald-300/10 text-emerald-200" : item.status === "rejected" ? "bg-rose-300/10 text-rose-200" : "bg-amber-300/10 text-amber-200"}`}>{item.status}</span></div>
                  <p className="mt-1 text-xs capitalize text-white/40">{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</p>
                  {item.adminNote ? <p className="mt-2 text-xs text-white/45">Note: {item.adminNote}</p> : null}
                </article>
              ))}
            </div>
          ) : <div className="mt-4 flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center"><Clock3 size={20} className="text-white/35" /><p className="mt-2 text-sm text-white/45">No withdrawals yet</p></div>}
        </aside>
      </main>
    </div>
  );
}
