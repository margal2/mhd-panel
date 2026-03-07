import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Search, Plus, Loader2 } from "lucide-react";

interface StopResult {
  name: string;
  platforms: { id: string; name: string }[];
}

interface StopSearchProps {
  onSelectStop: (stop: { name: string; id: string }) => void;
}

interface PidStop {
  stop_id: string;
  stop_name: string;
  platform_code?: string;
  zone_id?: string;
}

// Normalize Czech diacritics for fuzzy matching
const removeDiacritics = (str: string): string =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const StopSearch = ({ onSelectStop }: StopSearchProps) => {
  const [query, setQuery] = useState("");
  const [allStops, setAllStops] = useState<PidStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  // Load all stops once from PID open data
  useEffect(() => {
    const fetchStops = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://data.pid.cz/stops/json/stops.json");
        const data = await res.json();
        
        // The data can be an array of stops or have a specific structure
        let stops: PidStop[] = [];
        if (Array.isArray(data)) {
          stops = data;
        } else if (data.stopGroups) {
          // Handle PID format with stop groups
          for (const group of data.stopGroups) {
            for (const stop of group.stops || []) {
              stops.push({
                stop_id: stop.gtfsIds?.[0] || stop.id || "",
                stop_name: group.name || stop.altIdosName || "",
                platform_code: stop.platform || "",
              });
            }
          }
        } else if (data.generatedAt && data.dataFormatVersion) {
          // Another PID format
          for (const group of data.stopGroups || []) {
            for (const stop of group.stops || []) {
              for (const gtfsId of stop.gtfsIds || []) {
                stops.push({
                  stop_id: gtfsId,
                  stop_name: `${group.name}${stop.platform ? ` (${stop.platform})` : ""}`,
                  platform_code: stop.platform || "",
                });
              }
            }
          }
        }
        
        setAllStops(stops);
      } catch (e) {
        console.error("Failed to load stops:", e);
        // Fallback: try Golemio API with larger limit
        try {
          const fallbackRes = await fetch("https://api.golemio.cz/v2/gtfs/stops?limit=10000", {
            headers: {
              Accept: "application/json",
              "x-access-token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzkzMiwiaWF0IjoxNzU3ODM1OTk2LCJleHAiOjExNzU3ODM1OTk2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiZTBmMTZiOTctOTk1Ny00ODRkLWJhMDYtZWY1MTE5Y2U5NWMzIn0.MheFv44g0u2YlSpPFjQYGb7hXboOoAM81f1HAvIg2V8",
            },
          });
          const fallbackData = await fallbackRes.json();
          const features = fallbackData.features || [];
          const fallbackStops: PidStop[] = features.map((f: any) => ({
            stop_id: f.properties?.stop_id || "",
            stop_name: f.properties?.stop_name || "",
            platform_code: f.properties?.platform_code || "",
          }));
          setAllStops(fallbackStops);
        } catch {
          setAllStops([]);
        }
      }
      setLoading(false);
    };
    fetchStops();
  }, []);

  // Group and filter stops based on query
  const results = useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = removeDiacritics(query);

    const matching = allStops.filter((s) =>
      removeDiacritics(s.stop_name).includes(normalizedQuery)
    );

    // Group by base stop name (remove platform info)
    const grouped: Record<string, StopResult> = {};
    for (const stop of matching) {
      const baseName = stop.stop_name.replace(/\s*\(.*\)$/, "").trim();
      if (!grouped[baseName]) {
        grouped[baseName] = { name: baseName, platforms: [] };
      }
      grouped[baseName].platforms.push({
        id: stop.stop_id,
        name: stop.stop_name,
      });
    }

    return Object.values(grouped).slice(0, 20);
  }, [query, allStops]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hledat zastávku..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Načítám seznam zastávek...</span>
        </div>
      )}

      <ScrollArea className="h-[300px]">
        {!loading && results.map((stop) => (
          <div key={stop.name} className="border-b border-border last:border-0">
            <button
              className="w-full text-left p-2 hover:bg-muted/30 transition-colors flex items-center gap-2"
              onClick={() => setExpandedStop(expandedStop === stop.name ? null : stop.name)}
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{stop.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{stop.platforms.length} zastávek</span>
            </button>
            {expandedStop === stop.name && (
              <div className="pl-8 pb-2 space-y-1">
                {stop.platforms.map((platform) => (
                  <button
                    key={platform.id}
                    className="w-full text-left p-1.5 px-2 hover:bg-primary/10 rounded text-xs flex items-center gap-2 transition-colors"
                    onClick={() => onSelectStop({ name: platform.name, id: platform.id })}
                  >
                    <Plus className="h-3 w-3 text-primary" />
                    <span className="text-foreground">{platform.name}</span>
                    <span className="text-muted-foreground ml-auto font-mono">{platform.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="text-sm text-muted-foreground p-2">Žádné výsledky</p>
        )}
      </ScrollArea>
    </div>
  );
};

export default StopSearch;
