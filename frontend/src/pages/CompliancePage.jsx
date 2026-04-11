import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import ComplianceStatus from "@/components/dashboard/ComplianceStatus";

const fallbackCompliance = {
  audit_readiness_score: 78,
  cis_benchmarks: [
    { name: "AWS Foundations", status: "pass", score: 92 },
    { name: "Access Control", status: "warning", score: 76 },
    { name: "Network Security", status: "fail", score: 45 }
  ]
};

const CompliancePage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [compliance, setCompliance] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadCompliance = async () => {
    try {
      const [complianceRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/dashboard/compliance`, authHeaders),
        axios.get(`${API}/dashboard/notifications`, authHeaders)
      ]);
      setCompliance(complianceRes.data);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      console.warn("Using local compliance data because the backend was unavailable:", error);
      setCompliance(fallbackCompliance);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompliance();
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
    if (label === "Threats") {
      navigate("/threats");
      return;
    }
    if (label === "Credentials") {
      navigate("/credentials");
      return;
    }
    if (label === "Compliance") return;
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="compliance-page">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection="Compliance"
        onNavigate={handleSidebarNavigate}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header notifications={notifications} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section>
              <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
              <p className="text-muted-foreground mt-1">View benchmark posture and audit readiness.</p>
            </section>

            {loading ? (
              <div className="text-muted-foreground">Loading compliance...</div>
            ) : (
              <ComplianceStatus data={compliance} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompliancePage;
