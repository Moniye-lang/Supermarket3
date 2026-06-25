"use client";

import { useEffect, useState } from "react";

export default function useStoreCountdown(storeOpenTime = "08:00", storeCloseTime = "20:00") {
  const [countdown, setCountdown] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const [openH, openM] = storeOpenTime.split(":").map(Number);
      const [closeH, closeM] = storeCloseTime.split(":").map(Number);

      const open = new Date(now);
      open.setHours(openH, openM, 0, 0);

      const close = new Date(now);
      close.setHours(closeH, closeM, 0, 0);

      let target: Date, status: "open" | "closed";
      if (now < open) {
        target = open;
        status = "closed";
      } else if (now > close) {
        target = new Date(open.getTime() + 24 * 60 * 60 * 1000);
        status = "closed";
      } else {
        target = close;
        status = "open";
      }

      const diff = target.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`);
      setIsOpen(status === "open");
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [storeOpenTime, storeCloseTime]);

  return { countdown, isOpen };
}
