import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Train } from "lucide-react";

interface Departure {
  id: string;
  lineNumber: string;
  endStation: string;
  plannedDeparture: string;
  delay: number;
  status: 'ontime' | 'delayed' | 'cancelled' | 'boarding';
}

// Mock data - replace with your API data
const mockDepartures: Departure[] = [
  {
    id: "1",
    lineNumber: "7",
    endStation: "Central Station",
    plannedDeparture: "14:23",
    delay: 0,
    status: "ontime"
  },
  {
    id: "2",
    lineNumber: "42",
    endStation: "Airport Terminal",
    plannedDeparture: "14:27",
    delay: 3,
    status: "delayed"
  },
  {
    id: "3",
    lineNumber: "15",
    endStation: "University Campus",
    plannedDeparture: "14:30",
    delay: 0,
    status: "boarding"
  },
  {
    id: "4",
    lineNumber: "23",
    endStation: "Shopping District",
    plannedDeparture: "14:35",
    delay: -1,
    status: "ontime"
  },
  {
    id: "5",
    lineNumber: "8",
    endStation: "Industrial Zone",
    plannedDeparture: "14:38",
    delay: 5,
    status: "delayed"
  },
  {
    id: "6",
    lineNumber: "91",
    endStation: "Residential Area",
    plannedDeparture: "14:42",
    delay: 0,
    status: "cancelled"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ontime':
      return 'bg-status-ontime text-background';
    case 'delayed':
      return 'bg-status-delayed text-background';
    case 'cancelled':
      return 'bg-status-cancelled text-background';
    case 'boarding':
      return 'bg-status-boarding text-background';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusText = (status: string, delay: number) => {
  switch (status) {
    case 'ontime':
      return delay < 0 ? `${Math.abs(delay)}min early` : 'On time';
    case 'delayed':
      return `+${delay}min`;
    case 'cancelled':
      return 'Cancelled';
    case 'boarding':
      return 'Boarding';
    default:
      return 'Unknown';
  }
};

const DepartureBoard = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Train className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Transit Departures
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Real-time departure information
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Departure Board */}
        <Card className="overflow-hidden border-border bg-card">
          {/* Table Header */}
          <div className="bg-secondary p-4 border-b border-border">
            <div className="grid grid-cols-12 gap-4 font-semibold text-secondary-foreground">
              <div className="col-span-2 text-center">Line</div>
              <div className="col-span-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destination
              </div>
              <div className="col-span-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Departure
              </div>
              <div className="col-span-3 text-center">Status</div>
            </div>
          </div>

          {/* Departure Rows */}
          <div className="divide-y divide-border">
            {mockDepartures.map((departure, index) => (
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
                    {departure.lineNumber}
                  </Badge>
                </div>

                {/* End Station */}
                <div className="col-span-4 flex items-center">
                  <span className="text-foreground font-medium text-lg">
                    {departure.endStation}
                  </span>
                </div>

                {/* Planned Departure */}
                <div className="col-span-3 flex items-center">
                  <span className="font-mono text-xl font-bold text-foreground">
                    {departure.plannedDeparture}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-3 flex justify-center">
                  <Badge 
                    className={`font-medium px-3 py-1 ${getStatusColor(departure.status)} ${
                      departure.status === 'boarding' ? 'animate-pulse-glow' : ''
                    }`}
                  >
                    {getStatusText(departure.status, departure.delay)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Refresh every 30 seconds for real-time updates</p>
        </div>
      </div>
    </div>
  );
};

export default DepartureBoard;