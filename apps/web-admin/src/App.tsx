import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";

import ApprovalsPage from "./pages/ApprovalsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import DashboardPage from "./pages/DashboardPage";
import ReleasesPage from "./pages/ReleasesPage";
import SupportRisksPage from "./pages/SupportRisksPage";
import TenantsPage from "./pages/TenantsPage";
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
        <h1>Nexus 客户运营管理台</h1>
        <div className="sidebar-section">工作区</div>
        <NavLink to="/" end>工作台 / 总览</NavLink>
        <NavLink to="/tenants">客户 / 租户</NavLink>
        <NavLink to="/users">用户与权限</NavLink>
        <div className="sidebar-section">运营</div>
        <NavLink to="/approvals">审批中心</NavLink>
        <NavLink to="/releases">发布中心</NavLink>
        <NavLink to="/support-risks">风险工单</NavLink>
        <NavLink to="/audit-logs">审计日志</NavLink>
      </aside>
      <main className="main">
        <div className="page-header">
          <div>
            <h2>客户订阅与运营管理</h2>
            <p className="page-sub">
              多租户 SaaS 运营平台 · 以权限与审批流驱动变更
            </p>
          </div>
          <div className="session-box">
            <div className="session-label">当前登录</div>
            <div className="session-email">{session?.email ?? "未登录"}</div>
            <div className="session-actions">
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="u-platform">platform@example.com · 平台管理员</option>
                <option value="u-tenant-admin">苏嘉宁 · Acme 租户管理员</option>
                <option value="u-auditor">audit@example.com · 审计员</option>
                <option value="u-release">release@example.com · 发布经理</option>
                <option value="u-orbit-admin">周然 · Orbit 客户管理员</option>
                <option value="u-nova-member">陈屿 · Nova 运营成员</option>
                <option value="u-nexus-admin">方澜 · Nexus Health 客户管理员</option>
              </select>
              <input
                placeholder="或输入任意邮箱切换"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <button onClick={switchUserByEmail}>切换</button>
            </div>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<DashboardPage session={session} />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/releases" element={<ReleasesPage />} />
          <Route path="/support-risks" element={<SupportRisksPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Routes>
      </main>
    </div>
  );
}
