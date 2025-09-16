import DepartureBoard from "./DepartureBoard";

const FourCornerDepartures = () => {
  const stops = [
    { name: "Na Pískách", id: "U40Z1P" },
    { name: "Na Pískách - Dědina", id: "U40Z2P" },
    { name: "Sušická - Bořislavka", id: "U3017Z1P" },
    { name: "Sušická - Hradčanská", id: "U3017Z2P" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-4">
      <div className="grid grid-cols-2 gap-4 h-screen">
        {/* Top Left */}
        <div className="flex flex-col">
          <DepartureBoard 
            stopName={stops[0].name} 
            stopId={stops[0].id} 
            limit={6}
          />
        </div>

        {/* Top Right */}
        <div className="flex flex-col">
          <DepartureBoard 
            stopName={stops[1].name} 
            stopId={stops[1].id} 
            limit={6}
          />
        </div>

        {/* Bottom Left */}
        <div className="flex flex-col">
          <DepartureBoard 
            stopName={stops[2].name} 
            stopId={stops[2].id} 
            limit={6}
          />
        </div>

        {/* Bottom Right */}
        <div className="flex flex-col">
          <DepartureBoard 
            stopName={stops[3].name} 
            stopId={stops[3].id} 
            limit={6}
          />
        </div>
      </div>
    </div>
  );
};

export default FourCornerDepartures;