import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Trash2, Sun, Moon } from "lucide-react";
import StopSearch from "./StopSearch";

export interface StopConfig {
  name: string;
  id: string;
}

interface SettingsPanelProps {
  stops: StopConfig[];
  onStopsChange: (stops: StopConfig[]) => void;
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
}

const SettingsPanel = ({ stops, onStopsChange, theme, onThemeChange }: SettingsPanelProps) => {
  const addStop = (stop: StopConfig) => {
    if (stops.find((s) => s.id === stop.id)) return;
    onStopsChange([...stops, stop]);
  };

  const removeStop = (id: string) => {
    onStopsChange(stops.filter((s) => s.id !== id));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nastavení</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Theme */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Vzhled</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label>Tmavý režim</Label>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => onThemeChange(checked ? "dark" : "light")}
              />
            </div>
          </div>

          <Separator />

          {/* Current Stops */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Aktuální zastávky ({stops.length})</h3>
            <div className="space-y-2">
              {stops.map((stop) => (
                <div key={stop.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{stop.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{stop.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeStop(stop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {stops.length === 0 && (
                <p className="text-sm text-muted-foreground">Žádné zastávky</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Add Stop */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Přidat zastávku</h3>
            <StopSearch onSelectStop={addStop} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
