import { useState, useEffect, useMemo } from "react";
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
  platform_code: string;
}

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzkzMiwiaWF0IjoxNzU3ODM1OTk2LCJleHAiOjExNzU3ODM1OTk2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiZTBmMTZiOTctOTk1Ny00ODRkLWJhMDYtZWY1MTE5Y2U5NWMzIn0.MheFv44g0u2YlSpPFjQYGb7hXboOoAM81f1HAvIg2V8";

const removeDiacritics = (str: string): string =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const StopSearch = ({ onSelectStop }: StopSearchProps) => {
  const [query, setQuery] = useState("");
  const [allStops, setAllStops] = useState<PidStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  // Load all stops once from Golemio API
  useEffect(() => {
    const fetchAllStops = async () => {
      setLoading(true);
      try {
        // Fetch all stops in batches
        let allFetched: PidStop[] = [];
        let offset = 0;
        const batchSize = 10000;
        let hasMore = true;

        while (hasMore) {
          const res = await fetch(
            `https://api.golemio.cz/v2/gtfs/stops?limit=${batchSize}&offset=${offset}`,
            {
              headers: {
                Accept: "application/json",
                "x-access-token": API_KEY,
              },
            }
          );
          const data = await res.json();
          const features = data.features || [];
          
          const batch: PidStop[] = features
            .filter((f: any) => {
              const id = f.properties?.stop_id || "";
              // Only keep PID-compatible IDs (ending with P, format like U40Z1P)
              return /^U\d+Z\d+P$/.test(id);
            })
            .map((f: any) => ({
              stop_id: f.properties?.stop_id || "",
              stop_name: f.properties?.stop_name || "",
              platform_code: f.properties?.platform_code || "",
            }));
          
          allFetched = [...allFetched, ...batch];
          hasMore = features.length === batchSize;
          offset += batchSize;
        }

        console.log(`Loaded ${allFetched.length} stops`);
        setAllStops(allFetched);
      } catch (e) {
        console.error("Failed to load stops:", e);
        setAllStops([]);
      }
      setLoading(false);
    };
    fetchAllStops();
  }, []);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = removeDiacritics(query);

    const matching = allStops.filter((s) =>
      removeDiacritics(s.stop_name).includes(normalizedQuery)
    );

    // Group by stop name
    const grouped: Record<string, StopResult> = {};
    for (const stop of matching) {
      const baseName = stop.stop_name;
      if (!grouped[baseName]) {
        grouped[baseName] = { name: baseName, platforms: [] };
      }
      // Avoid duplicate platform IDs
      if (!grouped[baseName].platforms.find(p => p.id === stop.stop_id)) {
        grouped[baseName].platforms.push({
          id: stop.stop_id,
          name: `${stop.stop_name} [${stop.stop_id}]`,
        });
      }
    }

    return Object.values(grouped).slice(0, 20);
  }, [query, allStops]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hledat zastávku (např. Hradčanská)..."
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
              onClick={() => {
                if (stop.platforms.length === 1) {
                  onSelectStop({ name: stop.name, id: stop.platforms[0].id });
                } else {
                  setExpandedStop(expandedStop === stop.name ? null : stop.name);
                }
              }}
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{stop.name}</span>
              {stop.platforms.length > 1 && (
                <span className="text-xs text-muted-foreground ml-auto">{stop.platforms.length} nástupišť</span>
              )}
            </button>
            {expandedStop === stop.name && stop.platforms.length > 1 && (
              <div className="pl-8 pb-2 space-y-1">
                {stop.platforms.map((platform) => (
                  <button
                    key={platform.id}
                    className="w-full text-left p-1.5 px-2 hover:bg-primary/10 rounded text-xs flex items-center gap-2 transition-colors"
                    onClick={() => onSelectStop({ name: stop.name, id: platform.id })}
                  >
                    <Plus className="h-3 w-3 text-primary" />
                    <span className="text-foreground font-mono">{platform.id}</span>
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
