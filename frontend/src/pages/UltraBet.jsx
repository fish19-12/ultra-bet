import { useMemo, useState } from "react";
import { useEffect } from "react";
import {
  Gift,
  Gamepad2,
  Search,
  SlidersHorizontal,
  WalletCards,
  Trophy,
  Users,
  Flame,
  ChevronRight,
  Play,
  Clock3,
  X,
} from "lucide-react";
import Auth from "./Auth";
import Profile from "./Profile";

const gameCards = [
  { title: "Aviator", label: "Hot", color: "from-[#d90025] via-[#3a0715] to-[#09090d]", mark: "✈" },
  { title: "777 Triple Sevens", label: "Popular", color: "from-[#efb900] via-[#9b4c00] to-[#46160d]", mark: "777" },
  { title: "Royal Flash", label: "New", color: "from-[#b80d45] via-[#4b091e] to-[#16071d]", mark: "♛" },
  { title: "Chicken Coin", label: "Live", color: "from-[#f39a00] via-[#7c2308] to-[#23070a]", mark: "♣" },
  { title: "Spin & Win", label: "Top", color: "from-[#00a88b] via-[#0b4f5e] to-[#111633]", mark: "◉" },
  { title: "Lucky Crown", label: "Exclusive", color: "from-[#9d45ff] via-[#4d1d8c] to-[#12071f]", mark: "♚" },
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
  { id: "social", label: "Social", icon: Users },
];

function GameCard({ game, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(game)}
      className="group min-w-0 text-left"
    >
      <div className={`relative aspect-[1.18] overflow-hidden rounded-[18px] bg-gradient-to-br ${game.color} shadow-[0_12px_30px_rgba(0,0,0,.28)]`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,255,255,.22),transparent_22%),linear-gradient(140deg,transparent,rgba(0,0,0,.5))]" />
        <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {game.label}
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-[44px] font-black italic tracking-[-8px] text-white drop-shadow-[0_8px_12px_rgba(0,0,0,.65)] transition duration-300 group-hover:scale-110">
          {game.mark}
        </span>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
      </div>
      <div className="mt-2.5 truncate px-1 text-[14px] font-semibold text-white">{game.title}</div>
    </button>
  );
}

export default function UltraBet() {
  const [activeTab, setActiveTab] = useState("lobby");
  const [bottomTab, setBottomTab] = useState("games");
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("ultraBetUser");
    const token = localStorage.getItem("ultraBetToken");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setLoggedIn(true);
      } catch {
        localStorage.removeItem("ultraBetUser");
        localStorage.removeItem("ultraBetToken");
      }
    }
  }, []);

  const onAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setLoggedIn(true);
    setAuthMode(null);
  };

  const onLogout = () => {
    localStorage.removeItem("ultraBetToken");
    localStorage.removeItem("ultraBetUser");
    setUser(null);
    setLoggedIn(false);
    setProfileOpen(false);
  };

  const filteredGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? gameCards.filter((game) => game.title.toLowerCase().includes(normalized))
      : gameCards;
  }, [query]);

  return (
    <div className="ultra-shell min-h-screen text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#111326]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-4 md:h-[78px] md:px-6">
          <button type="button" className="flex items-center" aria-label="Ultra Bet home">
            <img src="/logo.png" alt="Ultra Bet" className="h-11 max-w-[170px] object-contain md:h-12" />
          </button>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <button type="button" onClick={() => setProfileOpen(true)} className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-bold sm:flex">
                <WalletCards size={17} className="text-[#f4bd38]" />
                0.00 ETB
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => loggedIn ? setProfileOpen(true) : setAuthMode("login")}
              className="hidden h-11 rounded-xl border border-white/10 bg-white/[0.07] px-5 text-sm font-bold transition hover:bg-white/[0.12] sm:block"
            >
              {loggedIn ? user?.firstName || "Profile" : "Log in"}
            </button>
            <button
              type="button"
              onClick={() => loggedIn ? setProfileOpen(true) : setAuthMode("signup")}
              className="h-11 rounded-xl bg-[#f4bd38] px-4 text-sm font-black text-[#17191f] shadow-[0_8px_24px_rgba(244,189,56,.18)] transition hover:bg-[#ffd45d] sm:px-6"
            >
              {loggedIn ? "Profile" : "Sign up"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-3 pb-28 pt-3 md:px-6 md:pb-12 md:pt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["First deposit", "100% bonus", "🎁"],
            ["Daily rewards", "Claim daily", "🏆"],
            ["Live games", "24/7 action", "⚡"],
            ["Fast payouts", "Secure & quick", "🛡"],
          ].map(([title, subtitle, icon]) => (
            <button key={title} type="button" className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/[0.05] bg-[#191c31] px-3 text-left transition hover:border-[#f4bd38]/40 md:px-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2e324b] to-[#171929] text-xl shadow-inner">{icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold md:text-sm">{title}</span>
                <span className="mt-1 block truncate text-[10px] text-white/45 md:text-xs">{subtitle}</span>
              </span>
              <ChevronRight className="ml-auto hidden text-white/25 sm:block" size={16} />
            </button>
          ))}
        </div>

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
          <button type="button" className="flex h-[52px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#191c31] px-4 text-sm font-semibold text-white/65">
            <SlidersHorizontal size={19} />
            All Providers
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-xl font-black md:text-2xl">Top Selected Games</h1>
          <button type="button" className="text-xs font-semibold text-white/55 hover:text-white md:text-sm">Collapse</button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredGames.map((game) => (
            <GameCard key={game.title} game={game} onOpen={setSelectedGame} />
          ))}
        </div>

        {filteredGames.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/[0.06] bg-[#191c31] py-12 text-center text-sm text-white/50">
            No games match your search.
          </div>
        ) : null}

        <section className="mt-8 rounded-3xl border border-white/[0.06] bg-[#171a2b] p-5 md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f4bd38]">Live now</p>
              <h2 className="mt-1 text-lg font-black md:text-xl">Popular Sports</h2>
            </div>
            <Clock3 className="text-white/35" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Manchester United", "Chelsea", "2.10", "3.40"],
              ["Barcelona", "Real Madrid", "1.85", "4.20"],
              ["Boston Celtics", "Miami Heat", "2.05", "1.72"],
            ].map(([home, away, homeOdds, awayOdds]) => (
              <button key={home} type="button" className="rounded-2xl border border-white/[0.07] bg-[#20233a] p-4 text-left transition hover:border-[#f4bd38]/40">
                <div className="flex justify-between text-[11px] text-white/40"><span>Football</span><span>Live 72'</span></div>
                <div className="mt-3 flex justify-between text-sm font-bold"><span>{home}</span><span className="text-[#f4bd38]">{homeOdds}</span></div>
                <div className="mt-2 flex justify-between text-sm font-bold"><span>{away}</span><span className="text-[#f4bd38]">{awayOdds}</span></div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {selectedGame ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1e33] p-5 shadow-2xl">
            <button type="button" onClick={() => setSelectedGame(null)} className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/60" aria-label="Close">
              <X size={18} />
            </button>
            <div className={`mt-2 flex aspect-[1.8] items-center justify-center rounded-2xl bg-gradient-to-br ${selectedGame.color}`}>
              <span className="text-6xl font-black italic text-white drop-shadow-xl">{selectedGame.mark}</span>
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
          onClose={() => setProfileOpen(false)}
          onUserChange={(updatedUser) => setUser(updatedUser)}
          onLogout={onLogout}
        />
      ) : null}

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
                  setBottomTab(tab.id);
                  if (tab.id === "wallet" || tab.id === "promos") {
                    loggedIn ? setProfileOpen(true) : setAuthMode("signup");
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
    </div>
  );
}
