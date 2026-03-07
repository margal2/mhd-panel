import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzkzMiwiaWF0IjoxNzU3ODM1OTk2LCJleHAiOjExNzU3ODM1OTk2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiZTBmMTZiOTctOTk1Ny00ODRkLWJhMDYtZWY1MTE5Y2U5NWMzIn0.MheFv44g0u2YlSpPFjQYGb7hXboOoAM81f1HAvIg2V8";

interface StopResult {
  id: string;
  name: string;
  platforms: { id: string; name: string }[];
}

interface StopSearchProps {
  onSelectStop: (stop: { name: string; id: string }) => void;
}

const StopSearch = ({ onSelectStop }: StopSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StopResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  const searchStops = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.golemio.cz/v2/gtfs/stops?names=${encodeURIComponent(q)}&limit=15`,
        { headers: { "Accept": "application/json", "x-access-token": API_KEY } }
      );
      const data = await res.json();
      const features = data.features || data || [];
      
      // Group by parent stop name
      const grouped: Record<string, StopResult> = {};
      for (const f of features) {
        const name = f.properties?.stop_name || f.stop_name || "Unknown";
        const id = f.properties?.stop_id || f.stop_id || "";
        const parentName = name.replace(/\s*-\s*[A-Z0-9]+$/, "").replace(/\s*\(.*\)$/, "");
        
        if (!grouped[parentName]) {
          grouped[parentName] = { id: parentName, name: parentName, platforms: [] };
        }
        grouped[parentName].platforms.push({ id, name });
      }
      
      setResults(Object.values(grouped));
    } catch (e) {
      console.error("Stop search error:", e);
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchStops(query), 300);
    return () => clearTimeout(timeout);
  }, [query, searchStops]);

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

      <ScrollArea className="h-[300px]">
        {loading && <p className="text-sm text-muted-foreground p-2">Hledám...</p>}
        {results.map((stop) => (
          <div key={stop.id} className="border-b border-border last:border-0">
            <button
              className="w-full text-left p-2 hover:bg-muted/30 transition-colors flex items-center gap-2"
              onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{stop.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{stop.platforms.length} zastávek</span>
            </button>
            {expandedStop === stop.id && (
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
