import DepartureBoard from "./DepartureBoard";
import LiveClock from "./LiveClock";
import SettingsPanel, { StopConfig } from "./SettingsPanel";
import { useState, useEffect, useMemo } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_STOPS: StopConfig[] = [
  { name: "Na Pískách - Hradčanská", id: "U40Z1P" },
  { name: "Na Pískách - Dědina", id: "U40Z2P" },
  { name: "Sušická - Bořislavka", id: "U3017Z1P" },
  { name: "Sušická - Hradčanská", id: "U3017Z2P" },
];

const STORAGE_KEY = "mhd-dashboard-stops";
const THEME_KEY = "mhd-dashboard-theme";
const STOPS_PER_PAGE = 4;

const FourCornerDepartures = () => {
  const [stops, setStops] = useState<StopConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STOPS;
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
  });

  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(stops.length / STOPS_PER_PAGE));
  const currentStops = useMemo(
    () => stops.slice(page * STOPS_PER_PAGE, (page + 1) * STOPS_PER_PAGE),
    [stops, page]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
    // Reset page if out of bounds
    if (page >= Math.ceil(stops.length / STOPS_PER_PAGE)) {
      setPage(Math.max(0, Math.ceil(stops.length / STOPS_PER_PAGE) - 1));
    }
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
              expanded={true}
              onHeaderClick={() => setExpandedStop(null)}
            />
          </div>
        </div>
      )}

      {/* Grid of boards - 2x2, paginated */}
      {!expandedStop && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-1 sm:gap-2">
            {currentStops.map((stop) => (
              <div key={stop.id} className="min-h-0 flex flex-col overflow-hidden">
                <DepartureBoard
                  stopName={stop.name}
                  stopId={stop.id}
                  limit={6}
                  onHeaderClick={() => handleHeaderClick(stop.id)}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-1 flex-shrink-0">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FourCornerDepartures;
