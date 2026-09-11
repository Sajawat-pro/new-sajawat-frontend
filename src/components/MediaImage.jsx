"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function MediaImage(props) { return <ImageWithLoading key={String(props.src)} {...props} />; }
function ImageWithLoading({ src, alt, className = "", onLoad, onError, ...props }) {
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const ref = useRef(null);
  useEffect(() => { const retry = () => { setAttempt(0); setFailed(true); }; window.addEventListener("online", retry); return () => window.removeEventListener("online", retry); }, []);
  useEffect(() => {
    if (!failed || attempt >= 3) return;
    const timer = setTimeout(() => { setFailed(false); setAttempt(value => value + 1); }, Math.min(30000, 1500 * 2 ** attempt));
    return () => clearTimeout(timer);
  }, [failed, attempt]);
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth > 0) queueMicrotask(() => setLoaded(true)); }, []);
const safeSource = typeof src === "string" && src.startsWith("/") && !src.startsWith("//");
const retrySrc = safeSource ? src : null;
  return <>
    {!loaded && <span className="media-placeholder" role="status" aria-label={failed ? "Image unavailable; waiting to load" : "Loading image"}><span className="media-shimmer" /><span className="media-loading-mark" aria-hidden="true">S</span>{failed && attempt >= 3 && <span className="media-retry-note">Image unavailable</span>}</span>}
    {retrySrc && <Image key={attempt} ref={ref} src={retrySrc} alt={alt || ""} {...props} className={`${className} media-image ${loaded ? "media-loaded" : "media-pending"}`} onLoad={event => { setLoaded(true); setFailed(false); onLoad?.(event); }} onError={event => { setFailed(true); onError?.(event); }} />}
  </>;
}
