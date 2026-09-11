"use client";

import { useEffect, useState } from "react";

export default function IntroLoader() {
  const [visible, setVisible] = useState(true);
  const [textPosition, setTextPosition] = useState("above");
  const [fading, setFading] = useState(false);
  const [viewHeight, setViewHeight] = useState(600);

  useEffect(() => {
    const updateViewBox = () => {
      const ratio = window.innerHeight / window.innerWidth;
      setViewHeight(ratio * 1000);
    };

    updateViewBox();
    window.addEventListener("resize", updateViewBox);

    return () => window.removeEventListener("resize", updateViewBox);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const startedAt = Date.now();

    let enterTimer;
    let exitTimer;
    let fadeTimer;
    let removeTimer;

    // SAJAWAT enters from above
    enterTimer = setTimeout(() => {
      setTextPosition("center");
    }, 100);

    const finishLoader = () => {
      const elapsedTime = Date.now() - startedAt;

      // Loader stays visible for at least 1.8 seconds
      const remainingTime = Math.max(0, 1800 - elapsedTime);

      exitTimer = setTimeout(() => {
        // SAJAWAT moves downward
        setTextPosition("below");

        fadeTimer = setTimeout(() => {
          setFading(true);
        }, 650);

        removeTimer = setTimeout(() => {
          setVisible(false);
          document.body.style.overflow = "";
        }, 1300);
      }, remainingTime);
    };

    if (document.readyState === "complete") {
      finishLoader();
    } else {
      window.addEventListener("load", finishLoader, {
        once: true,
      });
    }

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);

      window.removeEventListener("load", finishLoader);

      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  const positions = {
    above: "translateY(-110vh)",
    center: "translateY(0)",
    below: "translateY(110vh)",
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-500 ease-out ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <svg
        className="h-full w-full"
        viewBox={`0 0 1000 ${viewHeight}`}
        preserveAspectRatio="xMidYMid slice"
        aria-label="Sajawat loading"
      >
        <defs>
          <mask
            id="sajawat-transparent-mask"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="1000"
            height={viewHeight}
          >
            {/* Visible black overlay */}
            <rect
              x="0"
              y="0"
              width="1000"
              height={viewHeight}
              fill="white"
            />

            {/* Transparent text cutout */}
            <text
              x="500"
              y={viewHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="black"
              fontSize="195"
              fontWeight="250"
              letterSpacing="-10"
              textLength="870"
              lengthAdjust="spacingAndGlyphs"
              style={{
                fontFamily:
                  "var(--font-intro), 'Arial Narrow', sans-serif",

                transform: positions[textPosition],
                transformBox: "view-box",
                transformOrigin: "center",

                transition:
                  "transform 900ms cubic-bezier(0.76, 0, 0.24, 1)",
              }}
            >
              SAJAWAT
            </text>
          </mask>
        </defs>

        <rect
          x="0"
          y="0"
          width="1000"
          height={viewHeight}
          fill="#000000"
          mask="url(#sajawat-transparent-mask)"
        />
      </svg>
    </div>
  );
}