import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-primary">
      <Clock className="h-4 w-4" />
      <span className="font-mono text-lg sm:text-xl font-bold tabular-nums">
        {time.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
};

export default LiveClock;
