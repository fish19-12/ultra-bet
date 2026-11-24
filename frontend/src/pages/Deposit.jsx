import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ImagePlus,
  Landmark,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import { apiRequest } from "../api";

const paymentOptions = [
  { id: "telebirr", name: "Telebirr", icon: Smartphone, recipient: "Ultra Bet", account: "0921296982" },
  { id: "cbe", name: "CBE", icon: Landmark, recipient: "Ultra Bet", account: "1000343654477" },
];

const statusStyles = {
  pending: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  approved: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  rejected: "border-rose-300/20 bg-rose-300/10 text-rose-200",
};

export default function Deposit({ user, onClose, onSupport }) {
  const [method, setMethod] = useState("telebirr");
  const [amount, setAmount] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [proof, setProof] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const selectedMethod = paymentOptions.find((option) => option.id === method);
  const amountValue = Number(amount);
  const validAmount = Number.isFinite(amountValue) && amountValue >= 50 && amountValue <= 1000000;

  useEffect(() => {
    let active = true;
    apiRequest("/api/deposits/mine")
      .then((payload) => {
        if (active) setHistory(payload.deposits || []);
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

  useEffect(() => {
    if (!proof) {
      setPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(proof);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [proof]);

  const formattedBalance = useMemo(
    () => Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [user?.balance],
  );

  const copyAccount = async () => {
    await navigator.clipboard?.writeText(selectedMethod.account);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validAmount) {
      setError("Enter a deposit amount of at least 50 ETB.");
      return;
    }
    if (payerPhone.replace(/\D/g, "").length < 8) {
      setError("Enter the phone number you used to make the payment.");
      return;
    }
    if (!proof) {
      setError("Add a screenshot of your completed payment.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("paymentMethod", method);
      formData.append("payerPhone", payerPhone);
      formData.append("proof", proof);

      const payload = await apiRequest("/api/deposits", {
        method: "POST",
        body: formData,
      });
      setHistory((current) => [payload.deposit, ...current]);
      setSuccess(payload.message);
      setAmount("");
      setPayerPhone("");
      setProof(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#101222] text-white">
      <header className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#111326]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={onClose} className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
            <ArrowLeft size={19} /> <span className="hidden sm:inline">Back to Ultra Bet</span>
          </button>
          <h1 className="font-black">Add funds</h1>
          <button type="button" onClick={onSupport} className="text-sm font-bold text-[#f4bd38]">Support</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 pb-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-8">
        <section>
          <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#24213d] via-[#1b1d32] to-[#17192b] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/45">Available balance</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="text-3xl font-black sm:text-4xl">{formattedBalance} <span className="text-lg text-white/50">ETB</span></p>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4bd38]/10 text-[#f4bd38]"><WalletIcon /></div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.06] p-3 text-xs leading-5 text-emerald-100/70">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={16} />
              Deposits are added to your balance only after an administrator verifies the payment.
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/[0.07] bg-[#191c30] p-5 sm:p-7">
            <div>
              <h2 className="text-lg font-black">Choose a payment method</h2>
              <p className="mt-1 text-sm text-white/45">Minimum deposit: 50 ETB</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                const active = method === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => { setMethod(option.id); setCopied(false); }}
                    className={`flex min-h-[76px] items-center gap-3 rounded-2xl border px-4 text-left transition ${active ? "border-[#f4bd38]/45 bg-[#f4bd38]/[0.08]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/20"}`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-[#f4bd38] text-[#17191f]" : "bg-white/[0.07] text-white/60"}`}><Icon size={20} /></span>
                    <span className="font-bold">{option.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#22253a] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">Send payment to</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{selectedMethod.recipient}</p>
                  <p className="mt-1 text-xl font-black tracking-wide text-[#f4bd38]">{selectedMethod.account}</p>
                </div>
                <button type="button" onClick={copyAccount} className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs font-bold">
                  <Copy size={15} /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/45">Complete the transfer first. Then enter the payment details and upload the receipt below.</p>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">Amount (ETB)</span>
                <div className="flex h-[52px] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#22253a] px-4">
                  <CreditCard size={18} className="text-white/40" />
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="50" max="1000000" step="0.01" placeholder="Minimum 50" className="w-full bg-transparent text-white outline-none placeholder:text-white/35" />
                  <span className="text-xs font-bold text-white/35">ETB</span>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/75">Payment phone number</span>
                <div className="flex h-[52px] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#22253a] px-4">
                  <Smartphone size={18} className="text-white/40" />
                  <input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} inputMode="tel" placeholder="Number used for payment" className="w-full bg-transparent text-white outline-none placeholder:text-white/35" />
                </div>
              </label>

              <div>
                <span className="mb-2 block text-sm font-bold text-white/75">Payment screenshot</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    setProof(null);
                    setError("Screenshot must be 5 MB or smaller.");
                    event.target.value = "";
                    return;
                  }
                  setError("");
                  setProof(file);
                }} className="sr-only" id="deposit-proof" />
                <label htmlFor="deposit-proof" className="flex min-h-[104px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-[#22253a] p-3 text-center transition hover:border-[#f4bd38]/50">
                  {previewUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={previewUrl} alt="Payment screenshot preview" className="h-16 w-20 rounded-lg object-cover" />
                      <span className="max-w-[200px] truncate text-sm font-semibold">{proof?.name}</span>
                      <X size={17} className="text-white/40" />
                    </div>
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm text-white/45">
                      <ImagePlus size={23} className="text-[#f4bd38]" />
                      Choose a screenshot <span className="text-xs text-white/30">JPG, PNG, WebP · up to 5 MB</span>
                    </span>
                  )}
                </label>
              </div>

              {error ? <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-100">{error}</p> : null}
              {success ? <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-100"><CheckCircle2 size={17} />{success}</p> : null}

              <button type="submit" disabled={submitting || !validAmount} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#f4bd38] font-black text-[#17191f] transition hover:bg-[#ffd45d] disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? <LoaderCircle className="animate-spin" size={19} /> : <Upload size={18} />}
                {submitting ? "Submitting..." : "Submit for review"}
              </button>
            </form>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/[0.07] bg-[#191c30] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black">Deposit activity</h2>
              <p className="mt-1 text-sm text-white/45">Track your payment requests</p>
            </div>
            <Clock3 size={20} className="text-white/35" />
          </div>
          {loadingHistory ? (
            <div className="flex min-h-40 items-center justify-center text-sm text-white/45"><LoaderCircle className="mr-2 animate-spin" size={18} />Loading activity</div>
          ) : history.length ? (
            <div className="mt-5 space-y-3">
              {history.map((item) => (
                <article key={item._id || item.id} className="rounded-2xl border border-white/[0.06] bg-[#22253a] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{Number(item.amount).toLocaleString()} ETB</p>
                      <p className="mt-1 text-xs capitalize text-white/45">{item.paymentMethod} · {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyles[item.status] || ""}`}>{item.status}</span>
                  </div>
                  {item.adminNote ? <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-white/50">Review note: {item.adminNote}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-white/45"><Clock3 size={21} /></div>
              <p className="mt-3 text-sm font-bold">No deposit requests yet</p>
              <p className="mt-1 text-xs text-white/40">Your submitted requests will appear here.</p>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-[#f4bd38]/10 bg-[#f4bd38]/[0.04] p-4">
            <p className="text-sm font-bold">Need help?</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Contact support if you have a question about a payment or review.</p>
            <button type="button" onClick={onSupport} className="mt-3 text-xs font-bold text-[#f4bd38]">Open Telegram support →</button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function WalletIcon() {
  return <CreditCard size={23} />;
}
