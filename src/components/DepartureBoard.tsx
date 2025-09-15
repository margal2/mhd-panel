import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Train } from "lucide-react";
import { useState, useEffect } from "react";

interface Departure {
  id: string;
  line: string;
  direction: string;
  plannedTime: string;
  actualTime: string;
  delay: number;
}

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzkzMiwiaWF0IjoxNzU3ODM1OTk2LCJleHAiOjExNzU3ODM1OTk2LCJpc3MiOiJnb2xlbWlvIiwianRpIjoiZTBmMTZiOTctOTk1Ny00ODRkLWJhMDYtZWY1MTE5Y2U5NWMzIn0.MheFv44g0u2YlSpPFjQYGb7hXboOoAM81f1HAvIg2V8";
const STOP_ID = "U40Z1P";
const LIMIT = 12;
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

const DepartureBoard = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [status, setStatus] = useState<string>("Načítám...");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchDepartures = async () => {
    setStatus("Načítám data...");
    try {
      const response = await fetch(
        `https://api.golemio.cz/v2/pid/departureboards?ids=${STOP_ID}&limit=${LIMIT}`,
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
      const mapped = departuresData.map(mapDeparture).slice(0, LIMIT);
      
      setDepartures(mapped);
      setStatus("Aktualizováno");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
      setStatus("Chyba při načítání dat");
      setDepartures([]);
    }
  };

  useEffect(() => {
    fetchDepartures();
    const interval = setInterval(fetchDepartures, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Train className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Na Pískách — Odjezdy tramvají
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Informace o odjezdech v reálném čase
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{status} {lastUpdated && `- ${lastUpdated}`}</span>
          </div>
        </div>

        {/* Departure Board */}
        <Card className="overflow-hidden border-border bg-card">
          {/* Table Header */}
          <div className="bg-secondary p-4 border-b border-border">
            <div className="grid grid-cols-12 gap-4 font-semibold text-secondary-foreground">
              <div className="col-span-2 text-center">Linka</div>
              <div className="col-span-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Směr
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Plánovaný
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Skutečný
              </div>
              <div className="col-span-3 text-center">Zpoždění</div>
            </div>
          </div>

          {/* Departure Rows */}
          <div className="divide-y divide-border">
            {departures.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {status === "Chyba při načítání dat" ? "Nepodařilo se načíst odjezdy" : "Čekání na data..."}
              </div>
            ) : (
              departures.map((departure, index) => (
                <div
                  key={departure.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Line Number */}
                  <div className="col-span-2 flex justify-center">
                    <Badge 
                      variant="outline" 
                      className="font-mono text-lg px-3 py-1 border-primary text-primary font-bold"
                    >
                      {departure.line}
                    </Badge>
                  </div>

                  {/* Direction */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-foreground font-medium text-sm">
                      {departure.direction}
                    </span>
                  </div>

                  {/* Planned Time */}
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono text-lg font-bold text-muted-foreground">
                      {departure.plannedTime}
                    </span>
                  </div>

                  {/* Actual Time */}
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono text-lg font-bold text-foreground">
                      {departure.actualTime}
                    </span>
                  </div>

                  {/* Delay */}
                  <div className="col-span-3 flex justify-center">
                    <Badge 
                      className={`font-medium px-3 py-1 ${getDelayColor(departure.delay)}`}
                    >
                      {getDelayText(departure.delay)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Aktualizace každých 30 sekund</p>
        </div>
      </div>
    </div>
  );
};

export default DepartureBoard;