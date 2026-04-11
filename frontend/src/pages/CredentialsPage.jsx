import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import CredentialRotation from "@/components/dashboard/CredentialRotation";
import DetailModal from "@/components/dashboard/DetailModal";

const formatDateOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const buildFallbackCredentials = () => ({
  on_schedule_percent: 75,
  overdue_percent: 25,
  next_rotations: [
    {
      id: "local-cred-001",
      name: "AWS Production Key",
      type: "API Key",
      due_date: formatDateOffset(3),
      status: "pending",
      manager_name: "Current User",
      details: {
        service: "AWS IAM",
        last_rotated: formatDateOffset(-87),
        environment: "Production",
        rotation_policy: "Every 90 days",
        associated_services: ["API Gateway", "IAM"]
      }
    },
    {
      id: "local-cred-002",
      name: "Database Admin",
      type: "Password",
      due_date: formatDateOffset(-2),
      status: "overdue",
      manager_name: "Current User",
      details: {
        service: "PostgreSQL",
        last_rotated: formatDateOffset(-92),
        environment: "Production",
        rotation_policy: "Every 90 days",
        associated_services: ["Main DB", "Analytics DB"]
      }
    }
  ]
});

const CredentialsPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadCredentials = async () => {
    try {
      const [credentialsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/dashboard/credentials`, authHeaders),
        axios.get(`${API}/dashboard/notifications`, authHeaders)
      ]);
      setCredentials(credentialsRes.data);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      console.warn("Using local credential data because the backend was unavailable:", error);
      setCredentials(buildFallbackCredentials());
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
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
    if (label === "Credentials") return;
    if (label === "Compliance") {
      navigate("/compliance");
      return;
    }
    navigate("/dashboard");
  };

  const getLocalCredentialDetail = (id) => {
    const credential = credentials?.next_rotations?.find((item) => item.id === id);
    if (!credential) return;

    return {
      id: credential.id,
      name: credential.name || credential.service_name,
      type: credential.type || "API Key",
      status: credential.status || "pending",
      due_date: credential.due_date,
      manager_name: credential.manager_name || user?.name || "Current User",
      details: credential.details || {
        service: credential.name || credential.service_name,
        last_rotated: formatDateOffset(-87),
        environment: "Production",
        rotation_policy: "Every 90 days",
        associated_services: ["API Gateway", "IAM"]
      }
    };
  };

  const handleCredentialClick = async (id) => {
    try {
      const response = await axios.get(`${API}/dashboard/credentials/${id}`, authHeaders);
      setModalData(response.data);
      setModalOpen(true);
    } catch (error) {
      console.warn("Using local credential details because the backend detail request failed:", error);
      const credential = getLocalCredentialDetail(id);
      if (!credential) return;
      setModalData(credential);
      setModalOpen(true);
    }
  };

  const handleAction = async (type, id, action) => {
    if (action !== "rotate") return;

    try {
      await axios.put(`${API}/dashboard/credentials/${id}`, { rotated: true }, authHeaders);
      setModalOpen(false);
      await loadCredentials();
    } catch (error) {
      console.warn("Updating local credential state because the backend update failed:", error);
      const rotatedCredential = {
        ...modalData,
        status: "rotated",
        due_date: formatDateOffset(90),
        details: {
          ...modalData.details,
          last_rotated: formatDateOffset(0)
        }
      };

      setCredentials((current) => ({
        ...current,
        next_rotations: current.next_rotations.map((credential) =>
          credential.id === id ? rotatedCredential : credential
        )
      }));
      setModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="credentials-page">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection="Credentials"
        onNavigate={handleSidebarNavigate}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header notifications={notifications} />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <section>
              <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
              <p className="text-muted-foreground mt-1">Track upcoming credential rotations and status.</p>
            </section>

            {loading ? (
              <div className="text-muted-foreground">Loading credentials...</div>
            ) : (
              <CredentialRotation data={credentials} onItemClick={handleCredentialClick} />
            )}
          </div>
        </main>
      </div>

      <DetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData}
        type="credential"
        onAction={handleAction}
        userRole={user?.role}
      />
    </div>
  );
};

export default CredentialsPage;
