import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import ThreatSection from "@/components/dashboard/ThreatSection";
import DetailModal from "@/components/dashboard/DetailModal";

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const buildFallbackAlerts = () => [
  {
    id: "local-alert-001",
    title: "Suspicious Login Attempt",
    severity: "high",
    status: "open",
    description: "Multiple failed login attempts from unknown IP.",
    source: "SIEM",
    timestamp: hoursAgo(1)
  },
  {
    id: "local-alert-002",
    title: "New Device Detected",
    severity: "medium",
    status: "investigating",
    description: "User account accessed from an unrecognized device.",
    source: "Identity Provider",
    timestamp: hoursAgo(3)
  }
];

const buildFallbackChartData = () =>
  Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      date: date.toLocaleDateString(undefined, { weekday: "short" }),
      high: [2, 1, 4, 0, 2, 3, 1][index],
      medium: [5, 3, 2, 4, 6, 5, 4][index],
      low: [10, 8, 9, 7, 11, 9, 8][index]
    };
  });

const ThreatsPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadThreats = async () => {
    try {
      const [alertsRes, chartRes] = await Promise.all([
        axios.get(`${API}/dashboard/alerts`, authHeaders),
        axios.get(`${API}/dashboard/alerts-chart`, authHeaders)
      ]);

      setAlerts(alertsRes.data);
      setChartData(chartRes.data);
    } catch (error) {
      console.warn("Using local threat data because the backend was unavailable:", error);
      setAlerts(buildFallbackAlerts());
      setChartData(buildFallbackChartData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSidebarNavigate = (label) => {
    if (label === "Users & Accounts") {
      navigate("/users-accounts");
      return;
    }
    if (label === "Settings") {
      navigate("/settings");
      return;
    }
    if (label === "Threats") return;
    if (label === "Credentials") {
      navigate("/credentials");
      return;
    }
    if (label === "Compliance") {
      navigate("/compliance");
      return;
    }
    navigate("/dashboard");
  };

  const getLocalAlertDetail = (id) => {
    const alert = alerts.find((item) => item.id === id);
    if (!alert) return null;

    return {
      ...alert,
      assigned_name: alert.assigned_name || user?.name || "Current User",
      details: alert.details || {
        recommended_action: "Review account activity and enforce MFA challenge."
      }
    };
  };

  const handleAlertClick = async (id) => {
    try {
      const response = await axios.get(`${API}/dashboard/alerts/${id}`, authHeaders);
      setModalData(response.data);
      setModalOpen(true);
    } catch (error) {
      console.warn("Using local alert details because the backend detail request failed:", error);
      const alert = getLocalAlertDetail(id);
      if (!alert) return;
      setModalData(alert);
      setModalOpen(true);
    }
  };

  const handleAction = async (type, id, action) => {
    try {
      await axios.put(`${API}/dashboard/alerts/${id}`, { status: action }, authHeaders);
      setModalOpen(false);
      await loadThreats();
    } catch (error) {
      console.warn("Updating local alert state because the backend update failed:", error);
      setAlerts((current) =>
        current.map((alert) => alert.id === id ? { ...alert, status: action } : alert)
      );
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="threats-page">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection="Threats"
        onNavigate={handleSidebarNavigate}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header notifications={[]} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section>
              <h1 className="text-3xl font-bold tracking-tight">Threats</h1>
              <p className="text-muted-foreground mt-1">Review and investigate anomaly alerts.</p>
            </section>

            {loading ? (
              <div className="text-muted-foreground">Loading threats...</div>
            ) : (
              <ThreatSection
                alerts={alerts}
                chartData={chartData}
                onAlertClick={handleAlertClick}
                isPersonalView={false}
              />
            )}
          </div>
        </main>
      </div>

      <DetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData}
        type="alert"
        onAction={handleAction}
        userRole={user?.role}
      />
    </div>
  );
};

export default ThreatsPage;
