"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";

type ScrollTintBannerProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

/** Adds a barely-visible tint while the visitor scrolls downward. */
export default function ScrollTintBanner({ children, className = "", ...props }: ScrollTintBannerProps) {
  const [scrollingDown, setScrollingDown] = useState(false);

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;

    const handleScroll = () => {
      const currentY = window.scrollY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrollingDown(currentY > previousY + 1);
        previousY = currentY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section {...props} className={`relative isolate ${className}`}>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[5] bg-black transition-opacity duration-500 ${scrollingDown ? "opacity-[0.07]" : "opacity-0"}`}
      />
      {children}
    </section>
  );
}
