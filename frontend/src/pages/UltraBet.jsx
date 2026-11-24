import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Gift,
  Gamepad2,
  Search,
  SlidersHorizontal,
  WalletCards,
  Trophy,
  Flame,
  Play,
  X,
  UserRound,
} from "lucide-react";
import Auth from "./Auth";
import Profile from "./Profile";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import { apiRequest } from "../api";
import sportsBanner from "../assets/banner 1.png";
import virtualGamesBanner from "../assets/banner.png";
import jetGameArt from "../assets/games/jet.png";
import crashGameArt from "../assets/games/crash.png";
import diceGameArt from "../assets/games/dice.png";
import slotsGameArt from "../assets/games/slots.png";
import minesGameArt from "../assets/games/mines.png";
import plinkoGameArt from "../assets/games/plinko.png";

const gameCards = [
  { title: "Aviator", label: "Hot", provider: "Spribe", category: "crash", color: "from-[#d90025] via-[#3a0715] to-[#09090d]", mark: "✈" },
  { title: "JetX", label: "Popular", provider: "Spribe", category: "crash", color: "from-[#4f37fa] via-[#171452] to-[#09090d]", mark: "🚀", image: jetGameArt },
  { title: "Spaceman", label: "New", provider: "Pragmatic Play", color: "from-[#b80d45] via-[#4b091e] to-[#16071d]", mark: "👨‍🚀" },
  { title: "Crash", label: "Hot", provider: "Spribe", category: "crash", color: "from-[#ef4c24] via-[#68160a] to-[#190a0b]", mark: "📈", image: crashGameArt },
  { title: "Dice", label: "Popular", provider: "Pragmatic Play", color: "from-[#6854ff] via-[#252263] to-[#111126]", mark: "🎲", image: diceGameArt },
  { title: "777 Slots", label: "Top", provider: "Pragmatic Play", color: "from-[#e2a612] via-[#71320a] to-[#220b0b]", mark: "🎰", image: slotsGameArt },
  { title: "Mines", label: "New", provider: "Spribe", color: "from-[#07a5a1] via-[#07545b] to-[#0c1726]", mark: "💎", image: minesGameArt },
  { title: "Plinko", label: "Popular", provider: "Evolution", color: "from-[#cb3e73] via-[#63224b] to-[#171126]", mark: "🐂", image: plinkoGameArt },
  { title: "Rocket Rush", label: "Hot", provider: "Spribe", category: "crash", color: "from-[#f45d16] via-[#77220c] to-[#1d1011]", mark: "🚀" },
  { title: "Space Flight", label: "Live", provider: "Pragmatic Play", category: "crash", color: "from-[#4a53ff] via-[#242254] to-[#111126]", mark: "🛸" },
  { title: "Lucky Wheel", label: "Live", provider: "Evolution", color: "from-[#ed9340] via-[#7d3b22] to-[#1b1027]", mark: "🎡" },
  { title: "Blackjack 21", label: "Popular", provider: "Evolution", color: "from-[#007d63] via-[#06463e] to-[#101322]", mark: "♠" },
  { title: "Royal Roulette", label: "Top", provider: "Evolution", color: "from-[#be163a] via-[#5c112a] to-[#170c20]", mark: "🎯" },
  { title: "Golden Spin", label: "New", provider: "Pragmatic Play", color: "from-[#e3ad19] via-[#845509] to-[#211407]", mark: "✨" },
  { title: "Treasure Hunt", label: "Exclusive", provider: "Pragmatic Play", color: "from-[#00a88b] via-[#0b4f5e] to-[#111633]", mark: "🗝️" },
  { title: "777 Triple Sevens", label: "Popular", provider: "Pragmatic Play", color: "from-[#efb900] via-[#9b4c00] to-[#46160d]", mark: "777" },
  { title: "Royal Flash", label: "New", provider: "Evolution", color: "from-[#b80d45] via-[#4b091e] to-[#16071d]", mark: "♛" },
  { title: "Chicken Coin", label: "Live", provider: "Pragmatic Play", color: "from-[#f39a00] via-[#7c2308] to-[#23070a]", mark: "♣" },
  { title: "Spin & Win", label: "Top", provider: "Evolution", color: "from-[#00a88b] via-[#0b4f5e] to-[#111633]", mark: "◉" },
  { title: "Lucky Crown", label: "Exclusive", provider: "Spribe", color: "from-[#9d45ff] via-[#4d1d8c] to-[#12071f]", mark: "♚" },
];

const heroSlides = [
  {
    eyebrow: "ULTRA SPORTS",
    title: "The game is on.",
    description: "Explore football, basketball and more.",
    action: "Browse sports",
    image: sportsBanner,
    destination: "sports",
  },
  {
    eyebrow: "ULTRA GAMES",
    title: "Pick your next game.",
    description: "Discover a world of games in one place.",
    action: "Explore games",
    image: virtualGamesBanner,
    destination: "games",
  },
  {
    eyebrow: "ULTRA WALLET",
    title: "Ready when you are.",
    description: "Make a deposit to get started, from 50 ETB.",
    action: "Make a deposit",
    image: virtualGamesBanner,
    destination: "deposit",
  },
];

const tabs = [
  { id: "lobby", label: "Lobby", icon: Gamepad2 },
  { id: "hot", label: "Hot Games", icon: Flame },
  { id: "crash", label: "Crash", icon: Trophy },
];

const bottomTabs = [
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "wallet", label: "Wallet", icon: WalletCards },
  { id: "promos", label: "Promos", icon: Gift },
  { id: "profile", label: "Profile", icon: UserRound },
];

const demoEvents = [
  { id: "f1", sport: "Football", league: "Example League", time: "Today · 18:30", home: "Blue City", away: "Red United", odds: ["1.85", "3.25", "4.10"] },
  { id: "f2", sport: "Football", league: "Example Cup", time: "Today · 20:00", home: "North Stars", away: "South Athletic", odds: ["2.20", "3.10", "2.95"] },
  { id: "f3", sport: "Football", league: "Example League", time: "Tomorrow · 17:00", home: "River FC", away: "Highland Town", odds: ["1.95", "3.40", "3.65"] },
  { id: "b1", sport: "Basketball", league: "Demo Basketball", time: "Today · 21:00", home: "Capital Hoops", away: "Coastal Five", odds: ["1.72", "—", "2.05"] },
  { id: "t1", sport: "Tennis", league: "Demo Open", time: "Tomorrow · 14:00", home: "Player A", away: "Player B", odds: ["1.90", "—", "1.90"] },
  { id: "v1", sport: "Volleyball", league: "Demo Volleyball", time: "Tomorrow · 16:30", home: "East Spikers", away: "West Blockers", odds: ["1.80", "—", "2.00"] },
];

function GameCard({ game, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(game)}
      className="group min-w-0 text-left"
    >
      <div className={`relative aspect-[1.12] overflow-hidden rounded-[18px] bg-gradient-to-br ${game.color} shadow-[0_12px_30px_rgba(0,0,0,.28)]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,.22),transparent_22%),linear-gradient(140deg,transparent,rgba(0,0,0,.5))]" />
        {game.image ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#110c20]">
            <img src={game.image} alt="" className="h-full max-w-full object-contain transition duration-300 group-hover:scale-105" />
          </div>
        ) : null}
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {game.label}
        </div>
        {!game.image ? (
          <span className="absolute inset-0 flex items-center justify-center text-[48px] font-black text-white drop-shadow-[0_8px_12px_rgba(0,0,0,.65)] transition duration-300 group-hover:scale-110">
            {game.mark}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="mt-2.5 truncate px-1 text-[14px] font-semibold text-white">{game.title}</div>
    </button>
  );
}

function HeroCarousel({ onSports, onGames, onDeposit }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = heroSlides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const handleAction = slide.destination === "sports"
    ? onSports
    : slide.destination === "deposit" ? onDeposit : onGames;

  return (
    <section className="relative mb-4 h-[150px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#17182c] shadow-[0_14px_38px_rgba(0,0,0,.24)] sm:h-[174px]" aria-roledescription="carousel" aria-label="Featured Ultra Bet content">
      {heroSlides.map((item, index) => (
        <img
          key={item.eyebrow}
          src={item.image}
          alt=""
          aria-hidden="true"
          className={`absolute inset-y-0 right-0 h-full w-[72%] object-cover object-[72%_38%] transition-opacity duration-700 sm:w-[65%] ${index === activeSlide ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111326] via-[#111326]/90 via-45% to-transparent" />
      <div className="absolute inset-y-0 left-0 flex w-[78%] flex-col justify-center px-4 py-3 sm:w-[62%] sm:px-7">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#c181ff] sm:text-[10px]">{slide.eyebrow}</span>
        <h2 className="mt-1 text-[19px] font-black leading-tight sm:text-[25px]">{slide.title}</h2>
        <p className="mt-1 max-w-[290px] text-[10px] leading-4 text-white/65 sm:text-xs">{slide.description}</p>
        <button type="button" onClick={handleAction} className="mt-2.5 flex h-8 w-fit items-center gap-1.5 rounded-lg bg-[#f4bd38] px-3 text-[10px] font-black text-[#17191f] shadow-[0_5px_18px_rgba(244,189,56,.18)] transition hover:bg-[#ffd45d] sm:h-9 sm:px-4 sm:text-xs">
          {slide.action}
          <Play size={12} fill="currentColor" />
        </button>
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 sm:bottom-4 sm:right-5">
        {heroSlides.map((item, index) => (
          <button
            key={item.eyebrow}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Show ${item.eyebrow.toLowerCase()} banner`}
            aria-current={index === activeSlide ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all ${index === activeSlide ? "w-5 bg-[#f4bd38]" : "w-1.5 bg-white/45 hover:bg-white/75"}`}
          />
        ))}
      </div>
    </section>
  );
}

function SportsLobby({ loggedIn, onLogin }) {
  const sports = ["All sports", "Football", "Basketball", "Tennis", "Volleyball"];
  const [sport, setSport] = useState("All sports");
  const [selection, setSelection] = useState(null);
  const [stake, setStake] = useState("");
  const [notice, setNotice] = useState("");
  const events = sport === "All sports" ? demoEvents : demoEvents.filter((event) => event.sport === sport);
  const potentialReturn = Number(stake) * Number(selection?.odds || 0);

  const previewBet = () => {
    if (!loggedIn) {
      onLogin();
      return;
    }
    if (!selection || Number(stake) < 10) {
      setNotice("Choose a market and enter a demo stake of at least 10 ETB.");
      return;
    }
    setNotice("Demo only: this selection was not placed and no balance was changed.");
  };

  return (
    <section className="mx-auto max-w-[1180px] px-3 pb-28 pt-5 md:px-6 md:pb-12">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#25233d] to-[#191c30] p-5 sm:flex-row sm:items-end sm:p-7">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#f4bd38]"><Trophy size={15} /> Sportsbook</div>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Find your next match</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">Browse sample fixtures and explore a demo bet slip. Live fixtures, verified odds, and real wagers are not connected yet.</p>
        </div>
        <span className="w-fit rounded-full border border-amber-200/20 bg-amber-200/[0.07] px-3 py-1.5 text-[11px] font-bold text-amber-100">DEMO MARKETS</span>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {sports.map((item) => (
          <button key={item} type="button" onClick={() => setSport(item)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${sport === item ? "bg-[#f4bd38] text-[#17191f]" : "border border-white/[0.07] bg-[#191c30] text-white/55 hover:text-white"}`}>{item}</button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/[0.07] bg-[#191c30] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 text-xs text-white/40">
                <span className="font-bold text-white/60">{event.league} · {event.sport}</span><span>{event.time}</span>
              </div>
              <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
                <div className="flex items-center justify-between gap-4 sm:block">
                  <p className="font-bold">{event.home}</p><p className="my-1 text-[10px] uppercase tracking-wider text-white/30">vs</p><p className="font-bold">{event.away}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[280px]">
                  {["1", "Draw", "2"].map((pick, index) => {
                    const odds = event.odds[index];
                    const selected = selection?.eventId === event.id && selection?.pick === pick;
                    return (
                      <button
                        key={pick}
                        type="button"
                        disabled={odds === "—"}
                        onClick={() => { setSelection({ eventId: event.id, sport: event.sport, teams: `${event.home} vs ${event.away}`, pick, odds }); setNotice(""); }}
                        className={`rounded-xl border px-2 py-2.5 text-center transition ${selected ? "border-[#f4bd38]/60 bg-[#f4bd38]/15 text-[#f4bd38]" : "border-white/[0.06] bg-[#24273d] text-white/60 hover:border-white/20"} disabled:cursor-not-allowed disabled:opacity-30`}
                      >
                        <span className="block text-[10px]">{pick}</span><span className="mt-1 block text-sm font-black">{odds}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
          {!events.length ? <div className="rounded-2xl border border-white/[0.06] bg-[#191c30] p-8 text-center text-sm text-white/45">No sample events for this sport yet.</div> : null}
        </div>

        <aside className="h-fit rounded-2xl border border-white/[0.07] bg-[#191c30] p-5 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 font-black"><WalletCards size={18} className="text-[#f4bd38]" /> Demo bet slip</h2>
          {selection ? (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#24273d] p-3">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs font-bold text-[#f4bd38]">{selection.pick} · {selection.odds}</p><p className="mt-1 text-xs text-white/60">{selection.teams}</p></div>
                <button type="button" onClick={() => { setSelection(null); setNotice(""); }} aria-label="Remove selection" className="text-white/35 hover:text-white"><X size={16} /></button>
              </div>
              <label className="mt-4 block text-xs font-bold text-white/50">Demo stake (ETB)
                <input type="number" min="10" step="1" value={stake} onChange={(event) => setStake(event.target.value)} placeholder="Enter stake" className="mt-2 h-11 w-full rounded-lg border border-white/[0.07] bg-[#191c30] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#f4bd38]/40" />
              </label>
              <div className="mt-3 flex justify-between text-xs text-white/45"><span>Estimated return (demo)</span><strong className="text-white">{potentialReturn > 0 ? `${potentialReturn.toFixed(2)} ETB` : "—"}</strong></div>
            </div>
          ) : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs leading-5 text-white/40">Choose an odds button to add a sample selection to your slip.</p>}
          {notice ? <p role="status" className="mt-3 rounded-lg bg-amber-200/[0.07] p-3 text-xs leading-5 text-amber-100/80">{notice}</p> : null}
          <button type="button" onClick={previewBet} disabled={!selection} className="mt-4 h-11 w-full rounded-xl bg-[#f4bd38] text-sm font-black text-[#17191f] disabled:cursor-not-allowed disabled:opacity-40">{loggedIn ? "Preview demo bet" : "Log in to preview"}</button>
          <p className="mt-3 text-[10px] leading-4 text-white/30">Demo markets only. No wager is submitted, and your wallet balance is never affected.</p>
        </aside>
      </div>
    </section>
  );
}

export default function UltraBet() {
  const [activeTab, setActiveTab] = useState("lobby");
  const [bottomTab, setBottomTab] = useState("games");
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ultraBetUser") || "null");
    } catch {
      return null;
    }
  });
  const loggedIn = Boolean(user);
  const [authMode, setAuthMode] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [provider, setProvider] = useState("All Providers");
  const [providersOpen, setProvidersOpen] = useState(false);
  const [gamesCollapsed, setGamesCollapsed] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("ultraBetUser");
    const token = localStorage.getItem("ultraBetToken");
    if (!token || !storedUser) {
      if (!token) {
        localStorage.removeItem("ultraBetUser");
      }
      return;
    }

    apiRequest("/api/auth/me")
      .then((payload) => {
        localStorage.setItem("ultraBetUser", JSON.stringify(payload.user));
        setUser(payload.user);
      })
      .catch((error) => {
        if (error.status === 401) {
          localStorage.removeItem("ultraBetUser");
          localStorage.removeItem("ultraBetToken");
          setUser(null);
        }
      });
  }, []);

  const onAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthMode(null);
    setProfileOpen(true);
  };

  const onLogout = useCallback(() => {
    localStorage.removeItem("ultraBetToken");
    localStorage.removeItem("ultraBetUser");
    setUser(null);
    setProfileOpen(false);
    setBottomTab("games");
  }, []);

  const openDeposit = () => {
    if (!loggedIn) {
      setAuthMode("login");
      return;
    }
    setProfileOpen(false);
    setWithdrawOpen(false);
    setDepositOpen(true);
  };

  const openWithdraw = () => {
    if (!loggedIn) {
      setAuthMode("login");
      return;
    }
    setProfileOpen(false);
    setDepositOpen(false);
    setWithdrawOpen(true);
  };

  const openSupport = () => {
    window.open("https://t.me/+251921296982", "_blank", "noopener,noreferrer");
  };

  const filteredGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return gameCards.filter((game) => {
      const matchesSearch = !normalized || game.title.toLowerCase().includes(normalized);
      const matchesProvider = provider === "All Providers" || game.provider === provider;
      const matchesTab = activeTab === "lobby"
        || (activeTab === "hot" && ["Hot", "Popular", "Top"].includes(game.label))
        || (activeTab === "crash" && game.category === "crash");
      return matchesSearch && matchesProvider && matchesTab;
    });
  }, [activeTab, provider, query]);

  return (
    <div className="ultra-shell min-h-screen text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#111326]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-4 md:h-[78px] md:px-6">
          <button type="button" className="flex items-center" aria-label="Ultra Bet home">
            <img src="/logo.png" alt="Ultra Bet" className="h-11 max-w-[170px] object-contain md:h-12" />
          </button>
          <nav className="hidden items-center gap-2 lg:flex" aria-label="Main navigation">
            {[["games", "Games"], ["sports", "Sports"], ["promos", "Promos"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setBottomTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${bottomTab === id ? "bg-white/[0.08] text-[#f4bd38]" : "text-white/50 hover:text-white"}`}>{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <button type="button" onClick={openDeposit} className="flex items-center gap-1.5 rounded-xl border border-[#f4bd38]/15 bg-[#f4bd38]/[0.07] px-2.5 py-2.5 text-xs font-black text-[#f4bd38] transition hover:bg-[#f4bd38]/[0.12] sm:gap-2 sm:px-4 sm:text-sm">
                <WalletCards size={17} className="text-[#f4bd38]" />
                {Number(user?.balance || 0).toFixed(2)} ETB
              </button>
            ) : null}
            {loggedIn ? (
              <>
                <button type="button" onClick={openDeposit} className="h-10 rounded-xl bg-[#f4bd38] px-3 text-xs font-black text-[#17191f] transition hover:bg-[#ffd45d] sm:h-11 sm:px-5 sm:text-sm">Deposit</button>
                <button type="button" onClick={() => setProfileOpen(true)} className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-xs font-bold sm:h-11 sm:px-4 sm:text-sm"><UserRound size={17} /><span className="hidden sm:inline">{user?.firstName || "Profile"}</span></button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setAuthMode("login")} className="hidden h-11 rounded-xl border border-white/10 bg-white/[0.07] px-5 text-sm font-bold transition hover:bg-white/[0.12] sm:block">Log in</button>
                <button type="button" onClick={() => setAuthMode("signup")} className="h-11 rounded-xl bg-[#f4bd38] px-4 text-sm font-black text-[#17191f] shadow-[0_8px_24px_rgba(244,189,56,.18)] transition hover:bg-[#ffd45d] sm:px-6">Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      {bottomTab === "sports" ? (
        <SportsLobby loggedIn={loggedIn} onLogin={() => setAuthMode("login")} />
      ) : bottomTab === "promos" ? (
        <section className="mx-auto min-h-[70vh] max-w-5xl px-4 py-10 pb-28 sm:px-6">
          <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#27223e] to-[#191c30] p-6 sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4bd38]/10 text-[#f4bd38]"><Gift size={26} /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#f4bd38]">Promotions</p>
            <h1 className="mt-2 text-3xl font-black">Offers and rewards</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">There are no active offers at the moment. Check back later for updates from Ultra Bet.</p>
            <button type="button" onClick={() => setBottomTab("games")} className="mt-6 rounded-xl bg-[#f4bd38] px-5 py-3 text-sm font-black text-[#17191f]">Explore games</button>
          </div>
        </section>
      ) : (
      <main className="mx-auto max-w-[1180px] px-3 pb-28 pt-3 md:px-6 md:pb-12 md:pt-5">
        <HeroCarousel
          onSports={() => setBottomTab("sports")}
          onGames={() => setActiveTab("lobby")}
          onDeposit={openDeposit}
        />

        <nav className="mt-4 grid grid-cols-3 rounded-2xl bg-[#181b2d] p-1.5" aria-label="Game categories">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${active ? "bg-[#f4bd38] text-[#17191f] shadow-[0_8px_20px_rgba(244,189,56,.14)]" : "text-white/60 hover:text-white"}`}
              >
                <Icon size={20} fill={active ? "currentColor" : "none"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="flex h-[52px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#191c31] px-4 text-white/35">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search games..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={17} />
              </button>
            ) : null}
          </label>
          <div className="relative">
          <button type="button" onClick={() => setProvidersOpen((open) => !open)} className="flex h-[52px] w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#191c31] px-4 text-sm font-semibold text-white/65">
            <SlidersHorizontal size={19} />
            {provider}
          </button>
          {providersOpen ? (
            <div className="absolute right-0 top-[58px] z-20 w-full overflow-hidden rounded-xl border border-white/10 bg-[#20233a] shadow-xl">
              {["All Providers", "Spribe", "Pragmatic Play", "Evolution"].map((item) => (
                <button key={item} type="button" onClick={() => { setProvider(item); setProvidersOpen(false); }} className={`block w-full px-4 py-3 text-left text-sm hover:bg-white/[0.06] ${provider === item ? "text-[#f4bd38]" : "text-white/70"}`}>{item}</button>
              ))}
            </div>
          ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-xl font-black md:text-2xl">{activeTab === "lobby" ? "Top Selected Games" : activeTab === "hot" ? "Hot Games" : "Crash Games"}</h1>
          <button type="button" onClick={() => setGamesCollapsed((collapsed) => !collapsed)} className="text-xs font-semibold text-white/55 hover:text-white md:text-sm">{gamesCollapsed ? "Expand" : "Collapse"}</button>
        </div>

        {!gamesCollapsed ? (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredGames.map((game) => (
              <GameCard key={game.title} game={game} onOpen={setSelectedGame} />
            ))}
          </div>
        ) : null}

        {filteredGames.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-[#191c31] py-12 text-center text-sm text-white/50">
            No games match your search.
          </div>
        ) : null}

      </main>
      )}

      {selectedGame ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1e33] p-5 shadow-2xl">
            <button type="button" onClick={() => setSelectedGame(null)} className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/60" aria-label="Close">
              <X size={18} />
            </button>
            <div className={`relative mt-2 flex aspect-[1.8] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${selectedGame.color}`}>
              {selectedGame.image ? (
                <img src={selectedGame.image} alt={`${selectedGame.title} game artwork`} className="absolute inset-0 h-full w-full object-contain" />
              ) : (
                <span className="text-6xl font-black text-white drop-shadow-xl">{selectedGame.mark}</span>
              )}
            </div>
            <h2 className="mt-5 text-2xl font-black">{selectedGame.title}</h2>
            <p className="mt-2 text-sm text-white/50">Demo lobby · Sign in to play and use real-time features.</p>
            <button type="button" onClick={() => loggedIn ? setSelectedGame(null) : setAuthMode("login")} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f4bd38] font-black text-[#17191f]">
              <Play size={18} fill="currentColor" />
              Play now
            </button>
          </div>
        </div>
      ) : null}

      {authMode ? (
        <Auth
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={onAuthSuccess}
          onSwitch={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
        />
      ) : null}

      {profileOpen && user ? (
        <Profile
          user={user}
          onClose={() => { setProfileOpen(false); setBottomTab("games"); }}
          onDeposit={openDeposit}
          onWithdraw={openWithdraw}
          onUserChange={setUser}
          onLogout={onLogout}
        />
      ) : null}

      {depositOpen && loggedIn ? (
        <Deposit user={user} onClose={() => { setDepositOpen(false); setBottomTab("games"); }} onSupport={openSupport} onWithdraw={openWithdraw} />
      ) : null}

      {withdrawOpen && loggedIn ? (
        <Withdraw user={user} onClose={() => { setWithdrawOpen(false); setDepositOpen(true); }} onSupport={openSupport} onUserChange={setUser} />
      ) : null}

      {!profileOpen && !depositOpen && !withdrawOpen && !authMode ? (
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-[#151827]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="relative grid grid-cols-5">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = bottomTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === "profile") {
                    if (loggedIn) setProfileOpen(true);
                    else setAuthMode("login");
                    setBottomTab("profile");
                  } else if (tab.id === "wallet") {
                    openDeposit();
                  } else {
                    setBottomTab(tab.id);
                  }
                }}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${active ? "text-[#f4bd38]" : "text-white/55"}`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? "bg-[#f4bd38]/10" : ""}`}>
                  <Icon size={20} fill={active && tab.id === "games" ? "currentColor" : "none"} />
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
      ) : null}
    </div>
  );
}
