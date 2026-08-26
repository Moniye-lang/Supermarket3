"use client";

import { useEffect, useState } from "react";
import { getNowWAT, getStoreHoursForDay } from "@/lib/storeHours";

export default function useStoreCountdown() {
  const [countdown, setCountdown] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function updateCountdown() {
      const now = getNowWAT();
      const { openHour, closeHour } = getStoreHoursForDay(now);

      const open = new Date(now);
      open.setHours(openHour, 0, 0, 0);

      const close = new Date(now);
      close.setHours(closeHour, 0, 0, 0);

      let target: Date, status: "open" | "closed";
      if (now < open) {
        target = open;
        status = "closed";
      } else if (now >= close) {
        // Next opening
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const { openHour: nextOpenHour } = getStoreHoursForDay(tomorrow);
        const nextOpen = new Date(tomorrow);
        nextOpen.setHours(nextOpenHour, 0, 0, 0);
        target = nextOpen;
        status = "closed";
      } else {
        target = close;
        status = "open";
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      setIsOpen(status === "open");
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return { countdown, isOpen };
}

