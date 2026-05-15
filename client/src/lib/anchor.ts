"use client";
import { useEffect, useState, RefObject } from "react";

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

type Pos = { top: number; left: number };

export function useAnchorPosition(
  anchorRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  open: boolean,
  side: Side = "bottom",
  align: Align = "center",
  offset = 8
): Pos {
  const [pos, setPos] = useState<Pos>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function compute() {
      const a = anchorRef.current?.getBoundingClientRect();
      const c = contentRef.current?.getBoundingClientRect();
      if (!a || !c) return;
      let top = 0;
      let left = 0;
      if (side === "bottom") top = a.bottom + offset;
      else if (side === "top") top = a.top - c.height - offset;
      else if (side === "left") { left = a.left - c.width - offset; top = a.top; }
      else if (side === "right") { left = a.right + offset; top = a.top; }

      if (side === "top" || side === "bottom") {
        if (align === "start") left = a.left;
        else if (align === "end") left = a.right - c.width;
        else left = a.left + a.width / 2 - c.width / 2;
      } else {
        if (align === "start") top = a.top;
        else if (align === "end") top = a.bottom - c.height;
        else top = a.top + a.height / 2 - c.height / 2;
      }
      setPos({ top: top + window.scrollY, left: left + window.scrollX });
    }
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, side, align, offset, anchorRef, contentRef]);

  return pos;
}
