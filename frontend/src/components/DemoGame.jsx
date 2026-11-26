import { useEffect, useMemo, useRef, useState } from "react";
import { Play, RotateCcw, X } from "lucide-react";

const STARTING_CREDITS = 1000;
const MINE_COUNT = 3;
const SLOT_SYMBOLS = ["🍒", "🍋", "🍇", "🔔", "7️⃣"];
const PLINKO_MULTIPLIERS = [0, 0.5, 0.8, 1, 1.2, 1.5, 2, 5];

function readCredits() {
  const saved = Number(localStorage.getItem("ultraBetDemoCredits"));
  return Number.isFinite(saved) && saved >= 0 ? saved : STARTING_CREDITS;
}

function getGameType(title) {
  if (["Aviator", "JetX", "Spaceman", "Crash", "Rocket Rush", "Space Flight"].includes(title)) return "crash";
  if (title === "Mines") return "mines";
  if (title === "Plinko") return "plinko";
  if (title === "Dice") return "dice";
  if (["777 Slots", "Golden Spin", "777 Triple Sevens"].includes(title)) return "slots";
  if (title === "Blackjack 21") return "blackjack";
  if (title === "Royal Roulette") return "roulette";
  return "spin";
}

function randomInteger(max) {
  return Math.floor(Math.random() * max);
}

function pickSlotSymbol() {
  return SLOT_SYMBOLS[randomInteger(SLOT_SYMBOLS.length)];
}

function makeMinePositions() {
  const positions = new Set();
  while (positions.size < MINE_COUNT) positions.add(randomInteger(25));
  return positions;
}

function drawCard() {
  return randomInteger(13) + 1;
}

function cardValue(card) {
  return Math.min(card, 10);
}

function handValue(cards) {
  let total = cards.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = cards.filter((card) => card === 1).length;
  while (aces > 0 && total + 10 <= 21) {
    total += 10;
    aces -= 1;
  }
  return total;
}

function GameButton({ children, onClick, disabled = false, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
        secondary
          ? "border border-white/10 bg-white/[0.05] text-white/75 hover:bg-white/[0.09]"
          : "bg-[#f4bd38] text-[#17191f] hover:bg-[#ffd45d]"
      }`}
    >
      {children}
    </button>
  );
}

export default function DemoGame({ game, onClose }) {
  const [credits, setCredits] = useState(readCredits);
  const [bet, setBet] = useState("10");
  const [message, setMessage] = useState("");
  const [crashRunning, setCrashRunning] = useState(false);
  const [crashMultiplier, setCrashMultiplier] = useState(1);
  const crashMultiplierRef = useRef(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [mines, setMines] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [diceOver, setDiceOver] = useState(3);
  const [roulettePick, setRoulettePick] = useState("red");
  const [blackjack, setBlackjack] = useState(null);
  const gameType = getGameType(game.title);
  const stake = Number(bet);
  const mineMultiplier = useMemo(
    () => (25 / (25 - revealed.length)) * 0.95,
    [revealed.length],
  );

  useEffect(() => {
    localStorage.setItem("ultraBetDemoCredits", String(credits));
  }, [credits]);

  useEffect(() => {
    if (!crashRunning) return undefined;
    const timer = window.setInterval(() => {
      const next = Number((crashMultiplierRef.current + 0.04 + crashMultiplierRef.current * 0.012).toFixed(2));
      crashMultiplierRef.current = Math.min(next, crashPoint);
      setCrashMultiplier(crashMultiplierRef.current);
      if (next >= crashPoint) {
        setCrashRunning(false);
        setMessage(`Crashed at ${crashPoint.toFixed(2)}×. Your demo stake was lost.`);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [crashPoint, crashRunning]);

  const validStake = Number.isFinite(stake) && stake > 0 && stake <= credits;

  const placeDemoStake = () => {
    if (!validStake) {
      setMessage(credits > 0 ? "Enter a demo stake within your available credits." : "You are out of demo credits. Reset them to keep playing.");
      return false;
    }
    setCredits((current) => Number((current - stake).toFixed(2)));
    setMessage("");
    return true;
  };

  const payDemoReturn = (amount) => {
    setCredits((current) => Number((current + amount).toFixed(2)));
  };

  const playOneShot = () => {
    if (!placeDemoStake()) return;

    if (gameType === "dice") {
      const roll = randomInteger(6) + 1;
      const won = roll >= diceOver;
      if (won) payDemoReturn(stake * 2);
      setMessage(`You rolled ${roll}. ${won ? `You won ${(stake * 2).toFixed(2)} demo credits.` : "No win this round."}`);
      return;
    }

    if (gameType === "slots") {
      const spin = [pickSlotSymbol(), pickSlotSymbol(), pickSlotSymbol()];
      const matching = spin[0] === spin[1] && spin[1] === spin[2]
        ? 5
        : spin.some((symbol, index) => spin.indexOf(symbol) !== index) ? 1.5 : 0;
      if (matching) payDemoReturn(stake * matching);
      setMessage(`${spin.join("  ")} · ${matching ? `Won ${(stake * matching).toFixed(2)} demo credits!` : "No match this time."}`);
      return;
    }

    if (gameType === "plinko") {
      const multiplier = PLINKO_MULTIPLIERS[randomInteger(PLINKO_MULTIPLIERS.length)];
      const returned = stake * multiplier;
      if (returned) payDemoReturn(returned);
      setMessage(`The ball landed on ${multiplier}× · ${returned ? `Returned ${returned.toFixed(2)} demo credits.` : "No win this drop."}`);
      return;
    }

    if (gameType === "roulette") {
      const number = randomInteger(37);
      const color = number === 0 ? "green" : number % 2 === 0 ? "black" : "red";
      const won = color === roulettePick;
      if (won) payDemoReturn(stake * 2);
      setMessage(`The ball landed on ${number} ${color}. ${won ? `Won ${(stake * 2).toFixed(2)} demo credits.` : "No win this round."}`);
      return;
    }

    const multipliers = [0, 0.5, 1, 1.5, 2, 3];
    const multiplier = multipliers[randomInteger(multipliers.length)];
    const returned = stake * multiplier;
    if (returned) payDemoReturn(returned);
    setMessage(`${game.title} landed on ${multiplier}× · ${returned ? `Returned ${returned.toFixed(2)} demo credits.` : "No win this round."}`);
  };

  const startCrash = () => {
    if (!placeDemoStake()) return;
    crashMultiplierRef.current = 1;
    setCrashMultiplier(1);
    setCrashPoint(Number((1.1 + Math.random() * 5).toFixed(2)));
    setCrashRunning(true);
  };

  const cashOutCrash = () => {
    if (!crashRunning) return;
    setCrashRunning(false);
    const returned = stake * crashMultiplierRef.current;
    payDemoReturn(returned);
    setMessage(`Cashed out at ${crashMultiplierRef.current.toFixed(2)}× · Returned ${returned.toFixed(2)} demo credits.`);
  };

  const startMines = () => {
    if (!placeDemoStake()) return;
    setMines(makeMinePositions());
    setRevealed([]);
  };

  const revealMineTile = (index) => {
    if (!mines || revealed.includes(index)) return;
    if (mines.has(index)) {
      setMines(null);
      setRevealed([]);
      setMessage("Mine hit. Your demo stake was lost.");
      return;
    }
    setRevealed((current) => [...current, index]);
    setMessage("");
  };

  const cashOutMines = () => {
    if (!mines || !revealed.length) return;
    const returned = stake * mineMultiplier;
    payDemoReturn(returned);
    setMines(null);
    setRevealed([]);
    setMessage(`Cashed out at ${mineMultiplier.toFixed(2)}× · Returned ${returned.toFixed(2)} demo credits.`);
  };

  const dealBlackjack = () => {
    if (!placeDemoStake()) return;
    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    setBlackjack({ player, dealer, active: true });
    setMessage("");
  };

  const hitBlackjack = () => {
    if (!blackjack?.active) return;
    const player = [...blackjack.player, drawCard()];
    const total = handValue(player);
    if (total > 21) {
      setBlackjack({ ...blackjack, player, active: false });
      setMessage(`Bust at ${total}. Your demo stake was lost.`);
      return;
    }
    setBlackjack({ ...blackjack, player });
  };

  const standBlackjack = () => {
    if (!blackjack?.active) return;
    const dealer = [...blackjack.dealer];
    while (handValue(dealer) < 17) dealer.push(drawCard());
    const playerTotal = handValue(blackjack.player);
    const dealerTotal = handValue(dealer);
    const won = dealerTotal > 21 || playerTotal > dealerTotal;
    const push = playerTotal === dealerTotal;
    if (won) payDemoReturn(stake * 2);
    if (push) payDemoReturn(stake);
    setBlackjack({ ...blackjack, dealer, active: false });
    setMessage(won ? `You win! Returned ${(stake * 2).toFixed(2)} demo credits.` : push ? "Push. Your demo stake was returned." : `Dealer wins with ${dealerTotal}.`);
  };

  const resetCredits = () => {
    setCredits(STARTING_CREDITS);
    setMessage("Demo credits reset to 1,000.");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="demo-game-title">
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[#1b1e33] p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/60 hover:text-white" aria-label="Close game">
          <X size={18} />
        </button>
        <div className={`relative flex aspect-[2.4] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${game.color}`}>
          {game.image ? (
            <img src={game.image} alt="" className="absolute inset-0 h-full w-full object-contain" />
          ) : (
            <span className="text-6xl font-black text-white drop-shadow-xl">{game.mark}</span>
          )}
          <span className="absolute bottom-2 left-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-100">Practice demo</span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="demo-game-title" className="text-2xl font-black">{game.title}</h2>
            <p className="mt-1 text-xs text-white/45">Practice game · virtual credits only</p>
          </div>
          <div className="shrink-0 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-right">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-100/50">Demo credits</span>
            <span className="mt-0.5 block text-sm font-black text-emerald-100">{credits.toFixed(2)}</span>
          </div>
        </div>

        <label className="mt-5 block text-xs font-bold text-white/60">
          Demo stake
          <input
            type="number"
            min="1"
            step="1"
            value={bet}
            disabled={crashRunning || Boolean(mines) || Boolean(blackjack?.active)}
            onChange={(event) => setBet(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-[#14172a] px-3 text-sm text-white outline-none focus:border-[#f4bd38]/50 disabled:opacity-50"
          />
        </label>

        {gameType === "crash" ? (
          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-[#14172a] p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">Multiplier</p>
            <p className={`my-3 text-5xl font-black ${crashRunning ? "text-emerald-300" : "text-white"}`}>{crashMultiplier.toFixed(2)}×</p>
            <GameButton onClick={crashRunning ? cashOutCrash : startCrash} disabled={!crashRunning && !validStake}>
              {crashRunning ? `Cash out · ${(stake * crashMultiplier).toFixed(2)}` : <><Play size={16} fill="currentColor" /> Start round</>}
            </GameButton>
          </div>
        ) : null}

        {gameType === "mines" ? (
          <div className="mt-4">
            <p className="mb-2 text-xs text-white/45">Find safe tiles and cash out before hitting one of the 3 hidden mines.</p>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 25 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={!mines || revealed.includes(index)}
                  onClick={() => revealMineTile(index)}
                  className={`aspect-square rounded-lg text-sm font-black transition ${
                    revealed.includes(index) ? "bg-emerald-400/20 text-emerald-200"
                      : mines ? "bg-[#292d48] text-white/70 hover:bg-[#363b5d]"
                        : "bg-[#20243a] text-white/20"
                  } disabled:cursor-default`}
                >
                  {revealed.includes(index) ? "◆" : mines ? "?" : "·"}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-white/50">{revealed.length ? `Current cash-out: ${(stake * mineMultiplier).toFixed(2)} demo credits (${mineMultiplier.toFixed(2)}×)` : "Place a stake to start"}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <GameButton onClick={startMines} disabled={Boolean(mines)}>Start round</GameButton>
              <GameButton onClick={cashOutMines} disabled={!mines || !revealed.length} secondary>Cash out</GameButton>
            </div>
          </div>
        ) : null}

        {gameType === "dice" ? (
          <div className="mt-4">
            <label className="block text-xs font-bold text-white/50">Win if the die is at least
              <select value={diceOver} onChange={(event) => setDiceOver(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-[#14172a] px-3 text-sm text-white outline-none">
                {[2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} or higher · 2× return</option>)}
              </select>
            </label>
            <GameButton onClick={playOneShot} disabled={!validStake} >Roll die</GameButton>
          </div>
        ) : null}

        {gameType === "roulette" ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-white/50">Choose a color · 2× return on a match</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {["red", "black"].map((color) => (
                <button key={color} type="button" onClick={() => setRoulettePick(color)} className={`h-10 rounded-xl border text-xs font-black capitalize ${roulettePick === color ? "border-[#f4bd38]/50 bg-[#f4bd38]/10 text-[#f4bd38]" : "border-white/10 bg-white/[0.04] text-white/60"}`}>{color}</button>
              ))}
            </div>
            <GameButton onClick={playOneShot} disabled={!validStake}>Spin roulette</GameButton>
          </div>
        ) : null}

        {gameType === "blackjack" ? (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#14172a] p-3 text-center"><span className="block text-[10px] text-white/40">Your hand</span><strong className="mt-1 block text-lg">{blackjack ? handValue(blackjack.player) : "—"}</strong></div>
              <div className="rounded-xl bg-[#14172a] p-3 text-center"><span className="block text-[10px] text-white/40">Dealer</span><strong className="mt-1 block text-lg">{blackjack ? blackjack.active ? cardValue(blackjack.dealer[0]) : handValue(blackjack.dealer) : "—"}</strong></div>
            </div>
            {!blackjack?.active ? (
              <GameButton onClick={dealBlackjack} disabled={!validStake}>Deal cards</GameButton>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <GameButton onClick={hitBlackjack}>Hit</GameButton>
                <GameButton onClick={standBlackjack} secondary>Stand</GameButton>
              </div>
            )}
          </div>
        ) : null}

        {["slots", "plinko", "spin"].includes(gameType) ? (
          <div className="mt-4">
            {gameType === "slots" ? <p className="mb-3 rounded-xl bg-[#14172a] p-4 text-center text-xl">Match symbols to win · triple match returns 5×</p> : null}
            {gameType === "plinko" ? <p className="mb-3 rounded-xl bg-[#14172a] p-4 text-center text-xs text-white/60">Drop the ball to reveal a random multiplier from 0× to 5×.</p> : null}
            {gameType === "spin" ? <p className="mb-3 rounded-xl bg-[#14172a] p-4 text-center text-xs text-white/60">Try a practice spin for a random demo multiplier.</p> : null}
            <GameButton onClick={playOneShot} disabled={!validStake}>
              <Play size={16} fill="currentColor" />
              {gameType === "slots" ? "Spin reels" : gameType === "plinko" ? "Drop ball" : "Play demo round"}
            </GameButton>
          </div>
        ) : null}

        {message ? <p role="status" className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 text-center text-xs leading-5 text-white/70">{message}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
          <p className="text-[10px] leading-4 text-white/35">Practice only. Credits stay on this device and have no cash value.</p>
          <button type="button" onClick={resetCredits} className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-white/50 hover:text-white"><RotateCcw size={12} /> Reset credits</button>
        </div>
      </div>
    </div>
  );
}
