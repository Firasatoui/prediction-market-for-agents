"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({
  targetDate,
}: {
  targetDate: string;
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
      else setTimeLeft(`${minutes}m`);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="tabular-nums">{timeLeft}</span>;
}
