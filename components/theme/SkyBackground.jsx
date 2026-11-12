"use client";

import { useEffect, useRef } from "react";

export function SkyBackground() {
  const sceneRef = useRef(null);

  useEffect(() => {
    const updateAnimationState = () => {
      document.documentElement.classList.toggle("page-hidden", document.hidden);
    };
    updateAnimationState();
    document.addEventListener("visibilitychange", updateAnimationState);
    return () => document.removeEventListener("visibilitychange", updateAnimationState);
  }, []);

  useEffect(() => {
    const windows = sceneRef.current?.querySelectorAll(".building-window");
    if (!windows?.length) return undefined;

    const timer = window.setInterval(() => {
      if (
        document.hidden ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const windowToToggle = windows[Math.floor(Math.random() * windows.length)];
      windowToToggle.classList.toggle("lit");
    }, 700);

    return () => window.clearInterval(timer);
  }, []);

  const renderStars = () =>
    Array.from({ length: 60 }, (_, position) => {
      const left = (position * 37 + 11) % 100;
      const top = (position * 23 + 5) % 72;
      const size = 1 + ((position * 7) % 2);

      return (
        <span
          key={position}
          className="star"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}px`,
            height: `${size}px`,
            "--twinkle": `${2 + (position % 5)}s`,
            "--delay": `-${position % 6}s`,
          }}
        />
      );
    });

  const renderBuildings = (layer) =>
    Array.from({ length: 14 }, (_, index) => {
      const heightPercent =
        layer === "back"
          ? 36 + ((index * 17 + 13) % 50)
          : 24 + ((index * 19 + 7) % 43);
      const columns = 3 + (index % 2);
      const rows = Math.max(2, Math.floor(heightPercent / 9));

      return (
        <div
          key={`${layer}-${index}`}
          className="sky-building"
          style={{
            "--building-height": `${heightPercent}%`,
            "--window-cols": columns,
          }}
        >
          {Array.from({ length: columns * rows }, (_, windowIndex) => (
            <span
              key={windowIndex}
              className={`building-window ${
                (index * 13 + windowIndex * 7) % 10 < 4 ? "lit" : ""
              }`}
            />
          ))}
          {heightPercent > 76 && <span className="building-antenna" />}
        </div>
      );
    });

  const clouds = [
    { width: 260, top: "11%", speed: 115, delay: -72 },
    { width: 195, top: "25%", speed: 98, delay: -16 },
    { width: 300, top: "36%", speed: 132, delay: -104 },
    { width: 170, top: "16%", speed: 92, delay: -56 },
    { width: 230, top: "30%", speed: 108, delay: -38 },
    { width: 150, top: "42%", speed: 88, delay: -82 },
    { width: 280, top: "21%", speed: 124, delay: -122 },
  ];

  return (
    <div ref={sceneRef} className="sky-background" aria-hidden="true">
      <div className="sky-layer sky-day" />
      <div className="sky-layer sky-night" />
      <div className="sky-stars">
        <div className="star-field">{renderStars()}</div>
        <div className="star-field">{renderStars()}</div>
      </div>
      <div className="shooting-star" />
      <div className="sky-orb sky-sun" />
      <div className="sky-orb sky-moon" />
      {clouds.map((cloud, index) => (
        <span
          key={index}
          className="sky-cloud"
          style={{
            "--cloud-width": `${cloud.width}px`,
            "--cloud-height": `${cloud.width * 0.28}px`,
            "--cloud-top": cloud.top,
            "--cloud-speed": `${cloud.speed}s`,
            "--cloud-delay": `${cloud.delay}s`,
          }}
        />
      ))}
      <div className="skyline">
        <div className="skyline-layer skyline-back">{renderBuildings("back")}</div>
        <div className="skyline-layer skyline-front">{renderBuildings("front")}</div>
      </div>
    </div>
  );
}
