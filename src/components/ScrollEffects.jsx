"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    let scrollTimer;

    const handleScroll = () => {
      document.documentElement.classList.add("is-scrolling");

      clearTimeout(scrollTimer);

      scrollTimer = setTimeout(() => {
        document.documentElement.classList.remove("is-scrolling");
      }, 500);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
      document.documentElement.classList.remove("is-scrolling");
    };
  }, []);

  return null;
}