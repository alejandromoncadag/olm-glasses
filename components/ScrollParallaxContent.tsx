"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type ScrollParallaxContentProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Moves the editorial copy in the homepage "Tu visión, a tu manera" banner
 * as that single banner crosses the viewport. This component is intentionally
 * scoped to that copy block so no other homepage section receives the effect.
 */
export default function ScrollParallaxContent({ children, className = "" }: ScrollParallaxContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const banner = content.parentElement?.parentElement;
      if (!banner) return;

      const rect = banner.getBoundingClientRect();
      // Start the copy high as the banner enters from below, then bring it
      // down to its anchored position as the banner reaches the upper half of
      // the viewport. This makes the movement obvious in both scroll
      // directions without letting the buttons leave the image.
      const settlePoint = window.innerHeight * 0.45;
      const travel = Math.max(1, window.innerHeight - settlePoint);
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / travel));
      const offset = -440 + progress * 440;
      content.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={contentRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
