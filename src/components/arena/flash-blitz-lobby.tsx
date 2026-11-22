"use client";

import { Radio, Swords, Timer, Trophy, Users, Wifi, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CyberButton } from "@/components/ui/cyber-button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  connectFlashBlitzChannel,
  type FlashBlitzConnection,
} from "@/lib/arena/realtime-duel";
import { GRADE_LABELS } from "@/lib/gamification/ranks";
import { cn } from "@/lib/utils";
import type { BankQuestion, FlashBlitzOpponent } from "@/types/arena";
import type { GradeTier } from "@/types/gamification";

const ROUND_TIME = 12;
const MATCH_ROUNDS = 5;

const OPPONENTS: readonly FlashBlitzOpponent[] = [
  {
    name: "ياسين علاء",
    grade: "grade_11",
    rankTitleAr: "مهندس السايبر",
    accuracyRate: 0.78,
    avgSpeedMs: 4200,
  },
  {
    name: "ندى كريم",
    grade: "grade_10",
    rankTitleAr: "نينجا البرمجة",
    accuracyRate: 0.72,
    avgSpeedMs: 4700,
  },
];

interface FlashBlitzLobbyProps {
  pool: BankQuestion[];
  currentUser: {
    fullName: string;
    grade: GradeTier;
    rankTitleAr: string;
  };
  realtimeConfigured: boolean;
  onEarnXp: (xpDelta: number) => void;
}

export function FlashBlitzLobby({
  pool,
  currentUser,
  realtimeConfigured,
  onEarnXp,
}: FlashBlitzLobbyProps) {
  const [status, setStatus] = useState<
    "idle" | "searching" | "playing" | "finished"
  >("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [opponent, setOpponent] = useState<FlashBlitzOpponent>(OPPONENTS[0]);
  const [transportLabel, setTransportLabel] = useState<
    "supabase_realtime" | "simulated_match"
  >(realtimeConfigured ? "supabase_realtime" : "simulated_match");
  const [roundIdx, setRoundIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_TIME);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [pickedOption, setPickedOption] = useState<string | null>(null);
  const [opponentAnsweredThisRound, setOpponentAnsweredThisRound] =
    useState(false);

  const connectionRef = useRef<FlashBlitzConnection | null>(null);
  const matchQuestions = pool.slice(0, Math.min(MATCH_ROUNDS, pool.length));
  const activeQuestion = matchQuestions[roundIdx] ?? null;

  useEffect(() => {
    return () => {
      connectionRef.current?.disconnect();
    };
  }, []);

  const beginMatch = (targetRoom: string) => {
    const pickedOpponent =
      currentUser.grade === "grade_10" ? OPPONENTS[1] : OPPONENTS[0];
    setOpponent(pickedOpponent);
    setRoomCode(targetRoom);
    setStatus("searching");

    connectionRef.current?.disconnect();
    const conn = connectFlashBlitzChannel(
      targetRoom,
      currentUser.fullName,
      (remote) => {
        setOpponentScore(remote.score);
        setOpponentAnsweredThisRound(true);
      },
    );
    connectionRef.current = conn;
    setTransportLabel(conn.transport);

    window.setTimeout(() => {
      setRoundIdx(0);
      setMyScore(0);
      setOpponentScore(0);
      setPickedOption(null);
      setOpponentAnsweredThisRound(false);
      setSecondsLeft(ROUND_TIME);
      setStatus("playing");
    }, 650);
  };

  const handleQuickMatch = () => {
    const code = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
    beginMatch(code);
  };

  const handleJoinRoom = () => {
    const cleaned = joinCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    beginMatch(cleaned);
  };

  useEffect(() => {
    if (status !== "playing" || !activeQuestion) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (roundIdx + 1 >= matchQuestions.length) {
            setStatus("finished");
          } else {
            setRoundIdx((r) => r + 1);
            setPickedOption(null);
            setOpponentAnsweredThisRound(false);
            return ROUND_TIME;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status, activeQuestion, roundIdx, matchQuestions.length]);

  useEffect(() => {
    if (status !== "playing" || !activeQuestion || opponentAnsweredThisRound) {
      return;
    }

    const oppDelay = Math.min(5200, Math.max(2500, opponent.avgSpeedMs));
    const oppTimer = window.setTimeout(() => {
      setOpponentAnsweredThisRound(true);
      const hits = ((roundIdx + 1) % 4) !== 0;
      if (hits) {
        setOpponentScore((prev) => prev + 100);
      }
    }, oppDelay);

    return () => window.clearTimeout(oppTimer);
  }, [
    status,
    activeQuestion,
    roundIdx,
    opponent.avgSpeedMs,
    opponentAnsweredThisRound,
  ]);

  const handleAnswer = (option: string) => {
    if (status !== "playing" || !activeQuestion || pickedOption !== null) return;
    setPickedOption(option);
    const isCorrect = option === activeQuestion.correctAnswer;
    const roundPoints = isCorrect ? 100 + secondsLeft * 5 : 0;
    const nextScore = myScore + roundPoints;
    if (roundPoints > 0) {
      setMyScore(nextScore);
    }
    connectionRef.current?.sendPulse({
      sender: currentUser.fullName,
      round: roundIdx + 1,
      score: nextScore,
    });

    window.setTimeout(() => {
      if (roundIdx + 1 >= matchQuestions.length) {
        setStatus("finished");
        const xpBonus = nextScore >= opponentScore ? 160 : 80;
        onEarnXp(xpBonus);
      } else {
        setRoundIdx((r) => r + 1);
        setPickedOption(null);
        setOpponentAnsweredThisRound(false);
        setSecondsLeft(ROUND_TIME);
      }
    }, 650);
  };

  if (status === "idle") {
    return (
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-purple/45 bg-cyber-purple/15 px-3 py-1 text-xs font-extrabold text-purple-200">
              <Swords className="h-3.5 w-3.5 text-cyber-purple" />
              مبارزة 1v1 Flash Blitz
            </span>
            <h3 className="mt-2.5 text-xl font-extrabold text-chalk">
              ادخل مواجهة مباشرة في سرعة البديهة البرمجية
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-muted">
              5 جولات سريعة وجهاً لوجه — الفوز يمنحك دفعة XP إضافية في ترتيب صفك.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-xl border border-cyber-cyan/35 bg-cyber-cyan/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
            <Wifi className="h-3.5 w-3.5 text-cyber-cyan" />
            {realtimeConfigured
              ? "Supabase Realtime جاهز"
              : "وضع المحاكاة الفوري (Realtime Ready)"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-cyber-purple/30 bg-obsidian/80 p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Users className="h-4 w-4 text-cyber-purple" />
              <span>ماتش عشوائي سريع</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-muted">
              النظام يبحث عن منافس قريب من صفك الدراسي ({GRADE_LABELS[currentUser.grade]}) ويبدأ فوراً.
            </p>
            <div className="mt-4">
              <CyberButton
                variant="primary"
                className="w-full"
                onClick={handleQuickMatch}
                disabled={matchQuestions.length === 0}
              >
                <Zap className="h-4 w-4" />
                ابحث عن منافس الآن
              </CyberButton>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-obsidian/80 p-5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Radio className="h-4 w-4 text-cyber-cyan" />
              <span>غرفة تحدي خاصة بكود</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-muted">
              اكتب كود الغرفة لمنافسة زميلك عبر قناة Supabase Realtime المشتركة.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="CV-4042"
                aria-label="كود الغرفة الخاصة"
                className="code-ltr w-full rounded-xl border border-white/15 bg-[#06070B] px-3 py-2 text-xs text-chalk placeholder:text-slate-500 focus:border-cyber-cyan focus:outline-none"
              />
              <CyberButton
                variant="cyan"
                size="sm"
                onClick={handleJoinRoom}
                disabled={!joinCodeInput.trim() || matchQuestions.length === 0}
              >
                دخول
              </CyberButton>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (status === "searching") {
    return (
      <GlassCard className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl border border-cyber-cyan/50 bg-cyber-cyan/15 text-cyber-cyan">
          <Radio className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-extrabold text-white">
          جاري تجهيز ساحة النزال...
        </h3>
        <p className="mt-1 text-xs text-slate-muted">
          غرفة رقم{" "}
          <span dir="ltr" className="code-ltr font-bold text-cyan-200">
            {roomCode}
          </span>{" "}
          ·{" "}
          {transportLabel === "supabase_realtime"
            ? "اتصال Supabase Realtime نشط"
            : "محرك المطابقة التلقائية"}
        </p>
      </GlassCard>
    );
  }

  if (status === "finished") {
    const won = myScore >= opponentScore;
    const xpReward = won ? 160 : 80;
    return (
      <GlassCard variant="hero" className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-400/15 text-amber-300">
          <Trophy className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-extrabold text-white">
          {won ? "انتصار في Flash Blitz!" : "مواجهة قوية!"}
        </h3>
        <p className="mt-1 text-sm text-slate-muted">
          النتيجة: {myScore} نقطة مقابل {opponentScore} نقطة ضد {opponent.name}
        </p>
        <p className="tabular-nums-ltr mt-3 font-mono text-sm font-extrabold text-cyan-200">
          +{xpReward} XP
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <CyberButton variant="primary" onClick={handleQuickMatch}>
            مواجهة جديدة
          </CyberButton>
          <CyberButton variant="ghost" onClick={() => setStatus("idle")}>
            العودة للوبي
          </CyberButton>
        </div>
      </GlassCard>
    );
  }

  const totalBar = Math.max(1, myScore + opponentScore);
  const myShare = Math.round((myScore / totalBar) * 100);

  return (
    <GlassCard className="p-5 sm:p-6">
      {/* Head-to-Head Scoreboard */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-cyber-cyan/45 bg-cyber-cyan/10 p-3.5">
          <p className="text-xs font-bold text-cyan-200">{currentUser.fullName}</p>
          <p className="text-[11px] text-slate-muted">{currentUser.rankTitleAr}</p>
          <p className="tabular-nums-ltr mt-1 font-mono text-xl font-extrabold text-white">
            {myScore}
          </p>
        </div>

        <div className="rounded-2xl border border-cyber-pink/45 bg-cyber-pink/10 p-3.5 text-left">
          <p className="text-xs font-bold text-pink-200">{opponent.name}</p>
          <p className="text-[11px] text-slate-muted">{opponent.rankTitleAr}</p>
          <p className="tabular-nums-ltr mt-1 font-mono text-xl font-extrabold text-white">
            {opponentScore}
          </p>
        </div>
      </div>

      {/* Tug-of-war bar */}
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-cyber-pink/40">
        <div
          className="h-full bg-cyber-cyan transition-all duration-300"
          style={{ width: `${myScore + opponentScore === 0 ? 50 : myShare}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-muted">
        <span className="tabular-nums-ltr font-mono">
          الجولة {roundIdx + 1} / {matchQuestions.length} · غرفة {roomCode}
        </span>
        <span className="tabular-nums-ltr inline-flex items-center gap-1 font-mono font-bold text-cyan-200">
          <Timer className="h-3.5 w-3.5" />
          {secondsLeft}s
        </span>
      </div>

      {activeQuestion ? (
        <div className="mt-4 space-y-3">
          <p className="text-base font-extrabold text-white">
            {activeQuestion.promptAr}
          </p>
          {activeQuestion.codeSnippet ? (
            <pre
              dir="ltr"
              className="code-ltr overflow-x-auto rounded-xl border border-white/10 bg-[#06070B] p-3 text-xs text-cyan-200"
            >
              <code>{activeQuestion.codeSnippet}</code>
            </pre>
          ) : null}

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {activeQuestion.options.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={pickedOption !== null}
                onClick={() => handleAnswer(opt)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-right text-sm font-bold transition",
                  pickedOption === null &&
                    "border-white/15 bg-obsidian/80 text-chalk hover:border-cyber-cyan/60",
                  pickedOption === opt &&
                    opt === activeQuestion.correctAnswer &&
                    "border-emerald-400 bg-emerald-500/20 text-emerald-100",
                  pickedOption === opt &&
                    opt !== activeQuestion.correctAnswer &&
                    "border-rose-500 bg-rose-500/20 text-rose-100",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}
