"use client";
import { useEffect, useRef, useState } from "react";
import MediaImage from "@/components/MediaImage";
export default function HeroVideo() {
  const ref = useRef(null);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const video = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || navigator.connection?.saveData) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) video.play().catch(() => {}); else video.pause();
    }, { threshold: 0.1 });
    const visibility = () => { if (document.hidden) video.pause(); };
    observer.observe(video); document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (!failed || attempt >= 3) return;
    const timer = setTimeout(() => { setAttempt(value => value + 1); setFailed(false); ref.current?.load(); }, 3000 * (attempt + 1));
    return () => clearTimeout(timer);
  }, [failed, attempt]);
  return <><MediaImage src="/images/founders-favorites.png" alt="Sajawat botanical wall decor" fill priority sizes="100vw" className="object-cover" /><video ref={ref} src="/videos/hero.web.mp4" muted loop playsInline preload="metadata" onPlaying={() => setReady(true)} onWaiting={() => setReady(false)} onError={() => { setFailed(true); setReady(false); }} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} aria-label="Sajawat wall decor collection" /></>;
}
