import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth, API } from "@/App";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, RefreshCw, Siren, Activity } from "lucide-react";
import { toast } from "sonner";

const BehaviorBaseliningPanel = ({ onRefresh }) => {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState({
    profiles_built: 0,
    anomalies_detected: 0,
    high_severity_anomalies: 0,
    profiles: [],
    recent_anomalies: []
  });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
  const canManage = user?.role === "admin" || user?.role === "team_lead";

  const fetchSummary = async () => {
    if (!canManage) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/behavioral/summary`, authHeaders);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to load behavioral summary", error);
      toast.error("Failed to load behavioral baselining data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  const runAction = async (endpoint, successMessage) => {
    setRunning(true);
    try {
      await axios.post(`${API}${endpoint}`, {}, authHeaders);
      toast.success(successMessage);
      await fetchSummary();
      onRefresh?.();
    } catch (error) {
      console.error(`Failed action for ${endpoint}`, error);
      toast.error(error.response?.data?.detail || "Action failed");
    } finally {
      setRunning(false);
    }
  };

  if (!canManage) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-primary" />
            Behavioral Baselining
          </CardTitle>
          <CardDescription className="mt-1">
            Free anomaly detection using learned behavior profiles for users and service accounts.
          </CardDescription>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          Free ML
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4" data-testid="behavior-baselining-panel">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Profiles</p>
            <p className="text-xl font-semibold">{summary.profiles_built}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">Anomalies</p>
            <p className="text-xl font-semibold">{summary.anomalies_detected}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">High Severity</p>
            <p className="text-xl font-semibold">{summary.high_severity_anomalies}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runAction("/behavioral/recompute", "Behavior profiles recomputed")}
            disabled={running}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recompute Baselines
          </Button>
          <Button
            size="sm"
            onClick={() => runAction("/behavioral/simulate", "Anomalous event simulated and evaluated")}
            disabled={running}
          >
            <Siren className="w-4 h-4 mr-2" />
            Simulate Anomaly
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Learned Profiles
            </p>
            <ScrollArea className="h-[180px] rounded-lg border border-border/60 bg-background/30 p-3">
              <div className="space-y-3">
                {!loading && summary.profiles.length === 0 && (
                  <p className="text-sm text-muted-foreground">No profiles built yet.</p>
                )}
                {summary.profiles.map((profile) => (
                  <div key={profile.account_id} className="text-sm">
                    <p className="font-medium">{profile.account_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Hours: {profile.usual_hours?.join(", ") || "n/a"} · Locations: {profile.usual_locations?.join(", ") || "n/a"}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Siren className="w-4 h-4 text-muted-foreground" />
              Recent Anomalies
            </p>
            <ScrollArea className="h-[180px] rounded-lg border border-border/60 bg-background/30 p-3">
              <div className="space-y-3">
                {!loading && summary.recent_anomalies.length === 0 && (
                  <p className="text-sm text-muted-foreground">No anomalies detected yet.</p>
                )}
                {summary.recent_anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{anomaly.account_id}</p>
                      <Badge variant="outline" className={anomaly.score >= 70 ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}>
                        {anomaly.score}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {anomaly.reasons?.join("; ") || "No anomaly reasons recorded"}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BehaviorBaseliningPanel;
