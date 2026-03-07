import DepartureBoard from "./DepartureBoard";
import LiveClock from "./LiveClock";
import SettingsPanel, { StopConfig } from "./SettingsPanel";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const DEFAULT_STOPS: StopConfig[] = [
  { name: "Na Pískách - Hradčanská", id: "U40Z1P" },
  { name: "Na Pískách - Dědina", id: "U40Z2P" },
  { name: "Sušická - Bořislavka", id: "U3017Z1P" },
  { name: "Sušická - Hradčanská", id: "U3017Z2P" },
];

const STORAGE_KEY = "mhd-dashboard-stops";
const THEME_KEY = "mhd-dashboard-theme";

const FourCornerDepartures = () => {
  const [stops, setStops] = useState<StopConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STOPS;
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
  });

  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
  }, [stops]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleHeaderClick = (stopId: string) => {
    setExpandedStop(expandedStop === stopId ? null : stopId);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90 p-1 sm:p-2 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-1 sm:mb-2 flex-shrink-0">
        <LiveClock />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">Odjezdy MHD</h1>
        <SettingsPanel stops={stops} onStopsChange={setStops} theme={theme} onThemeChange={setTheme} />
      </div>

      {/* Expanded single board overlay */}
      {expandedStop && (
        <div className="flex-1 min-h-0 relative">
          <button
            onClick={() => setExpandedStop(null)}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="h-full">
            <DepartureBoard
              stopName={stops.find((s) => s.id === expandedStop)?.name || ""}
              stopId={expandedStop}
              limit={20}
              onHeaderClick={() => setExpandedStop(null)}
            />
          </div>
        </div>
      )}

      {/* Grid of boards */}
      {!expandedStop && (
        <div className={`flex-1 min-h-0 grid gap-1 sm:gap-2 ${
          stops.length <= 1 ? "grid-cols-1" :
          stops.length <= 2 ? "grid-cols-1 md:grid-cols-2" :
          stops.length <= 4 ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        } ${stops.length > 2 ? "grid-rows-2" : ""}`}>
          {stops.map((stop) => (
            <div key={stop.id} className="min-h-0 flex flex-col">
              <DepartureBoard
                stopName={stop.name}
                stopId={stop.id}
                limit={6}
                onHeaderClick={() => handleHeaderClick(stop.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FourCornerDepartures;
