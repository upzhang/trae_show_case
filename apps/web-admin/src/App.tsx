import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import ApprovalsPage from "./pages/ApprovalsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import DashboardPage from "./pages/DashboardPage";
import ReleasesPage from "./pages/ReleasesPage";
import UsersPage from "./pages/UsersPage";
import { api } from "./lib/api";
import { getCurrentUserId, setCurrentUserId } from "./lib/session";

import type { SessionView } from "./lib/api";

export default function App() {
  const [userId, setUserId] = useState<string>(getCurrentUserId());
  const [session, setSession] = useState<SessionView | null>(null);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    api
      .me()
      .then((view) => {
        setSession(view);
        setCurrentUserId(view.id, view.roles);
      })
      .catch(() => {
        setSession(null);
      });
  }, [userId]);

  async function switchUserByEmail(): Promise<void> {
    const email = emailInput.trim();
    if (!email) return;
    const res = await api.findUserByEmail(email);
    if ("error" in res) {
      window.alert(`未找到用户：${email}`);
      return;
    }
    setUserId(res.id);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Trae 企业验证后台</h1>
        <NavLink to="/" end>工作台</NavLink>
        <NavLink to="/users">用户管理</NavLink>
        <NavLink to="/approvals">审批</NavLink>
        <NavLink to="/releases">发布记录</NavLink>
        <NavLink to="/audit-logs">审计日志</NavLink>
      </aside>
      <main className="main">
        <div className="page-header">
          <h2>管理控制台</h2>
          <div className="session-box">
            <span>当前用户</span>
            <select
              value={session?.email ?? ""}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="u-platform">platform@example.com（平台管理员）</option>
              <option value="u-tenant-admin">tenant.admin@example.com（租户管理员）</option>
              <option value="u-auditor">audit@example.com（审计员）</option>
              <option value="u-release">release@example.com（发布经理）</option>
            </select>
            <input
              placeholder="或输入任意 email 切换"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button onClick={switchUserByEmail}>切换</button>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<DashboardPage session={session} />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Routes>
      </main>
    </div>
  );
}
