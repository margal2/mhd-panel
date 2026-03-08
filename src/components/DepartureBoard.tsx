import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, MapPin, Train, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";

interface Departure {
  id: string;
  line: string;
  direction: string;
  plannedTime: string;
  actualTime: string;
  delay: number;
}

interface DepartureBoardProps {
  stopName: string;
  stopId: string;
  limit?: number;
  expanded?: boolean;
  onHeaderClick?: () => void;
}

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzkzMiwiaWF0IjoxNzU3ODM1OTk2LCJleHAiOjExNzU3ODM1OTk2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiZTBmMTZiOTctOTk1Ny00ODRkLWJhMDYtZWY1MTE5Y2U5NWMzIn0.MheFv44g0u2YlSpPFjQYGb7hXboOoAM81f1HAvIg2V8";
const POLL_INTERVAL = 30000;

const parseDate = (val: string | null | undefined): Date | null => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const mapDeparture = (dep: any, index: number): Departure => {
  const line = dep.route?.short_name || dep.route_short_name || dep.line || '-';
  const direction = dep.trip?.headsign || dep.headsign || dep.destination || '-';

  let planned = parseDate(dep.departure_timestamp?.scheduled);
  let actual = parseDate(dep.departure_timestamp?.predicted);

  // Calculate delay properly
  let delay = 0;
  
  // First try to use the delay field if available
  if (dep.delay?.is_available && typeof dep.delay.minutes === 'number') {
    delay = dep.delay.minutes;
  } 
  // If both planned and actual times are available, calculate the difference
  else if (planned && actual) {
    delay = Math.round((actual.getTime() - planned.getTime()) / (1000 * 60)); // Convert to minutes
  }
  
  // Debug logging
  console.log(`Line ${line}: planned=${planned?.toISOString()}, actual=${actual?.toISOString()}, delay=${delay}, raw_delay=${dep.delay?.minutes}, timestamp_minutes=${dep.departure_timestamp?.minutes}`);

  return {
    id: index.toString(),
    line,
    direction,
    plannedTime: planned ? planned.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    actualTime: actual ? actual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    delay
  };
};

const getDelayColor = (delay: number) => {
  if (delay >= 3) return 'bg-status-delayed text-background';
  if (delay > 0) return 'bg-orange-500 text-background';
  return 'bg-status-ontime text-background';
};

const getDelayText = (delay: number) => {
  if (delay > 0) return `+${delay} min`;
  if (delay < 0) return `${delay} min`;
  return '0 min';
};

const DepartureBoard = ({ stopName, stopId, limit = 6, expanded = false, onHeaderClick }: DepartureBoardProps) => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [status, setStatus] = useState<string>("Načítám...");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchDepartures = async () => {
    setStatus("Načítám data...");
    try {
      const response = await fetch(
        `https://api.golemio.cz/v2/pid/departureboards?ids=${stopId}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json',
            'x-access-token': API_KEY
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const departuresData = data.departureboards?.[0]?.departures || data.departures || [];
      const mapped = departuresData.map(mapDeparture).slice(0, limit);
      
      setDepartures(mapped);
      setStatus("Aktualizováno");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
      setStatus("Chyba při načítání dat");
      setDepartures([]);
    }
  };

  const toggleExpanded = (departureId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(departureId)) {
        newSet.delete(departureId);
      } else {
        newSet.add(departureId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchDepartures();
    const interval = setInterval(fetchDepartures, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`overflow-hidden border-border bg-card/50 backdrop-blur-sm ${expanded ? "h-full flex flex-col" : ""}`}>
      {/* Header */}
      <div
        className={`bg-secondary/80 p-3 border-b border-border ${onHeaderClick ? "cursor-pointer hover:bg-secondary transition-colors" : ""}`}
        onClick={onHeaderClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <Train className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            {stopName}
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{status} {lastUpdated && `- ${lastUpdated}`}</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-secondary/40 p-2 border-b border-border">
        <div className="grid grid-cols-12 gap-2 font-semibold text-xs text-secondary-foreground">
          <div className="col-span-2 text-center">Linka</div>
          <div className="col-span-4">Směr</div>
          <div className="col-span-3 text-center">Čas</div>
          <div className="col-span-3 text-center">Zpoždění</div>
        </div>
      </div>

      {/* Departure Rows */}
      <div className={`divide-y divide-border overflow-y-auto ${expanded ? "flex-1" : "max-h-48"}`}>
        {departures.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {status === "Chyba při načítání dat" ? "Nepodařilo se načíst odjezdy" : "Čekání na data..."}
          </div>
        ) : (
          departures.map((departure, index) => (
            <Collapsible key={departure.id} open={expandedRows.has(departure.id)} onOpenChange={() => toggleExpanded(departure.id)}>
              <CollapsibleTrigger asChild>
                <div className="grid grid-cols-12 gap-2 p-2 hover:bg-muted/30 transition-colors text-sm cursor-pointer">
                  {/* Line Number */}
                  <div className="col-span-2 flex justify-center">
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs px-2 py-1 border-primary text-primary font-bold"
                    >
                      {departure.line}
                    </Badge>
                  </div>

                  {/* Direction */}
                  <div className="col-span-4 flex items-center">
                    <span className="text-foreground font-medium text-xs truncate">
                      {departure.direction}
                    </span>
                    {expandedRows.has(departure.id) ? 
                      <ChevronUp className="h-3 w-3 ml-1 flex-shrink-0" /> : 
                      <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                    }
                  </div>

                  {/* Time */}
                  <div className="col-span-3 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {departure.actualTime}
                    </span>
                  </div>

                  {/* Delay */}
                  <div className="col-span-3 flex justify-center">
                    <Badge 
                      className={`font-medium px-2 py-1 text-xs ${getDelayColor(departure.delay)}`}
                    >
                      {getDelayText(departure.delay)}
                    </Badge>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-muted/20 p-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-muted-foreground">Plánovaný čas:</span>
                      <div className="font-mono text-foreground">{departure.plannedTime}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Skutečný čas:</span>
                      <div className="font-mono text-foreground">{departure.actualTime}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="font-medium text-muted-foreground">Kompletní směr:</span>
                    <div className="text-foreground">{departure.direction}</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </Card>
  );
};

export default DepartureBoard;