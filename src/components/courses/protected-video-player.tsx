"use client";

import {
  Maximize2,
  Pause,
  Play,
  ShieldAlert,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProtectedVideoPlayerProps {
  lessonTitleAr: string;
  courseTitleAr: string;
  durationSeconds: number;
  bunnyVideoId: string | null;
  studentName: string;
  studentPhone: string;
}

interface WatermarkPos {
  topPct: number;
  leftPct: number;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 2] as const;

export function ProtectedVideoPlayer({
  lessonTitleAr,
  courseTitleAr,
  durationSeconds,
  bunnyVideoId,
  studentName,
  studentPhone,
}: ProtectedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPos>({
    topPct: 16,
    leftPct: 14,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const bunnyLibraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID?.trim();
  const hasBunnyEmbed = Boolean(bunnyLibraryId && bunnyVideoId);
  const safeDuration = Math.max(60, durationSeconds);

  // Move watermark to randomized safe coordinates at random 2.8s-5.0s intervals
  useEffect(() => {
    let timerId: number;

    const scheduleNextHop = () => {
      const nextIntervalMs = 2800 + Math.floor(Math.random() * 2200);
      timerId = window.setTimeout(() => {
        setWatermarkPos({
          topPct: 10 + Math.floor(Math.random() * 64),
          leftPct: 8 + Math.floor(Math.random() * 48),
        });
        scheduleNextHop();
      }, nextIntervalMs);
    };

    scheduleNextHop();
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!isPlaying || hasBunnyEmbed) return;

    const tick = window.setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + speed;
        if (next >= safeDuration) {
          setIsPlaying(false);
          return safeDuration;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [isPlaying, speed, safeDuration, hasBunnyEmbed]);

  const formatClock = (total: number) => {
    const rounded = Math.floor(total);
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void containerRef.current?.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen denial in restricted browsers
    }
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative overflow-hidden rounded-2xl border border-cyber-purple/35 bg-[#06070B] shadow-neon-purple select-none"
    >
      {/* Dynamic Moving Student Watermark */}
      <div
        data-testid="video-watermark"
        style={{
          top: `${watermarkPos.topPct}%`,
          left: `${watermarkPos.leftPct}%`,
          transition: "top 700ms ease, left 700ms ease",
        }}
        className="pointer-events-none absolute z-20 rounded-xl border border-cyber-cyan/35 bg-obsidian/70 px-3 py-1.5 backdrop-blur-sm"
      >
        <p className="text-[11px] font-extrabold text-cyan-200/90">
          {studentName}
        </p>
        <p
          dir="ltr"
          className="code-ltr text-[10px] font-bold text-pink-200/85"
        >
          {studentPhone}
        </p>
      </div>

      {/* Video Surface: Bunny.net Stream iframe OR Local Interactive Cyber Player */}
      {hasBunnyEmbed ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            title={lessonTitleAr}
            src={`https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${bunnyVideoId}?autoplay=false&preload=true`}
            className="h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="relative flex aspect-video w-full flex-col justify-between bg-[radial-gradient(circle_at_25%_20%,rgba(139,92,246,0.22),transparent_48%),radial-gradient(circle_at_80%_75%,rgba(6,182,212,0.18),transparent_45%),#070910] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyber-cyan/40 bg-cyber-cyan/15 px-3 py-1 text-[11px] font-extrabold text-cyan-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              بث مشفّر · Bunny Stream Ready
            </span>
            <span className="rounded-lg border border-white/10 bg-obsidian/80 px-2.5 py-1 text-[11px] font-semibold text-slate-muted">
              {courseTitleAr}
            </span>
          </div>

          <div className="my-auto flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? "إيقاف الفيديو مؤقتاً" : "تشغيل الفيديو"}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-cyber-cyan/60 bg-cyber-cyan/20 text-white shadow-neon-cyan transition hover:scale-105 hover:bg-cyber-cyan/30"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 translate-x-[-1px]" />
              )}
            </button>
            <h2 className="mt-4 max-w-lg text-base font-extrabold text-white sm:text-xl">
              {lessonTitleAr}
            </h2>
            <p className="mt-1 text-xs text-slate-muted">
              {isPlaying
                ? "جاري تشغيل الشرح — العلامة المائية تتحرك لحماية حقوق المحتوى"
                : "اضغط تشغيل لمتابعة الدرس"}
            </p>
          </div>

          {/* Player Bottom Controls */}
          <div className="space-y-2.5 rounded-xl border border-white/10 bg-obsidian/85 p-3 backdrop-blur-md">
            <input
              type="range"
              dir="ltr"
              min={0}
              max={safeDuration}
              value={currentSec}
              aria-label="شريط وقت الفيديو"
              onChange={(e) => setCurrentSec(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-cyber-cyan"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-bold text-chalk hover:border-cyber-cyan/50"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 text-cyber-cyan" />
                      إيقاف
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 text-cyber-cyan" />
                      تشغيل
                    </>
                  )}
                </button>

                <span className="tabular-nums-ltr font-mono text-[11px] text-slate-muted">
                  {formatClock(currentSec)} / {formatClock(safeDuration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-slate-muted" />
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSpeed(opt)}
                    className={cn(
                      "tabular-nums-ltr rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold transition",
                      speed === opt
                        ? "border-cyber-cyan/60 bg-cyber-cyan/20 text-cyan-100"
                        : "border-white/10 bg-white/5 text-slate-muted hover:text-chalk",
                    )}
                  >
                    {opt}x
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="ملء الشاشة"
                  onClick={handleFullscreen}
                  className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-muted hover:text-chalk"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
