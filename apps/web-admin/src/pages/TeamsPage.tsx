import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusDot } from "../components/StatusDot";
import { Select } from "../components/Select";
import { Tabs } from "../components/Tabs";

interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  memberCount?: number;
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role?: string;
  joinedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TeamDetail {
  team: Team;
  members: TeamMember[];
  tenantName?: string;
  permissions: string[];
}

const roleOptions = [
  { value: "owner", label: "拥有者" },
  { value: "admin", label: "管理员" },
  { value: "member", label: "成员" },
  { value: "viewer", label: "观察者" },
];

const roleColors: Record<string, "blue" | "green" | "orange" | "purple"> = {
  owner: "purple",
  admin: "blue",
  member: "green",
  viewer: "orange",
};

const roleLabels: Record<string, string> = {
  owner: "拥有者",
  admin: "管理员",
  member: "成员",
  viewer: "观察者",
};

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Map<string, TeamMember[]>>(new Map());
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [filter, setFilter] = useState("");

  // 新增状态：成员角色管理
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberRoleLoading, setMemberRoleLoading] = useState(false);

  // 新增状态：团队详情
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 新增状态：删除确认
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  // 新增状态：统计
  const [teamStats, setTeamStats] = useState({ total: 0, active: 0, inactive: 0, totalMembers: 0 });

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  async function fetchTeams() {
    setLoading(true);
    try {
      const response = await api.get("/teams");
      const data: Team[] = response || [];
      setTeams(data);

      const memberMap = new Map<string, TeamMember[]>();
      for (const team of data) {
        try {
          const membersResponse = await api.get(`/teams/${team.id}/members`);
          memberMap.set(team.id, membersResponse);
        } catch {
          memberMap.set(team.id, []);
        }
      }
      setMembers(memberMap);

      // 计算统计
      const active = data.filter(t => t.isActive).length;
      const inactive = data.filter(t => !t.isActive).length;
      let totalMembers = 0;
      memberMap.forEach(m => { totalMembers += m.length; });
      setTeamStats({ total: data.length, active, inactive, totalMembers });
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await api.get("/users");
      setUsers(response || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }

  async function fetchTeamDetail(teamId: string) {
    setDetailLoading(true);
    try {
      const response = await api.get(`/teams/${teamId}/detail`);
      setTeamDetail(response);
    } catch {
      // 模拟数据
      const team = teams.find(t => t.id === teamId);
      const teamMembers = members.get(teamId) || [];
      setTeamDetail({
        team: team || { id: teamId, name: "未知", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        members: teamMembers,
        tenantName: "默认租户",
        permissions: ["team:read", "team:write", "member:manage"],
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await api.post("/teams", newTeam);
      setShowCreateModal(false);
      setNewTeam({ name: "", description: "" });
      fetchTeams();
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/teams/${deleteTarget.id}`);
      setDeleteTarget(null);
      if (selectedTeam?.id === deleteTarget.id) {
        setSelectedTeam(null);
      }
      fetchTeams();
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  }

  async function handleAddMember(teamId: string, userId: string) {
    try {
      await api.post(`/teams/${teamId}/members`, { userId, role: "member" });
      fetchTeams();
    } catch (error) {
      console.error("Failed to add member:", error);
    }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    if (confirm("确定要移除该成员吗？")) {
      try {
        await api.delete(`/teams/${teamId}/members/${userId}`);
        fetchTeams();
      } catch (error) {
        console.error("Failed to remove member:", error);
      }
    }
  }

  async function handleUpdateMemberRole(teamId: string, userId: string, role: string) {
    setMemberRoleLoading(true);
    try {
      await api.put(`/teams/${teamId}/members/${userId}`, { role });
      fetchTeams();
    } catch (error) {
      console.error("Failed to update member role:", error);
    } finally {
      setMemberRoleLoading(false);
    }
  }

  function getUserName(userId: string): string {
    return users.find(u => u.id === userId)?.name || userId;
  }

  function getUserEmail(userId: string): string {
    return users.find(u => u.id === userId)?.email || "";
  }

  function openMemberModal(team: Team) {
    setSelectedTeam(team);
    setShowMemberModal(true);
  }

  function openDetailModal(team: Team) {
    setSelectedTeam(team);
    setShowDetailModal(true);
    fetchTeamDetail(team.id);
  }

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    t.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-container">
      <PageHeader
        title="团队管理"
        description="管理团队、成员与角色分配"
        actions={
          can("team:create") ? (
            <Button variant="primary" icon="plus" onClick={() => setShowCreateModal(true)}>
              创建团队
            </Button>
          ) : undefined
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard title="团队总数" value={teamStats.total} icon="user" color="blue" />
        <StatCard title="活跃团队" value={teamStats.active} icon="check-circle" color="green" />
        <StatCard title="禁用团队" value={teamStats.inactive} icon="x-circle" color="orange" />
        <StatCard title="成员总数" value={teamStats.totalMembers} icon="user-plus" color="purple" />
      </div>

      {/* 搜索 */}
      <SearchInput
        value={filter}
        onChange={setFilter}
        placeholder="搜索团队名称或描述..."
      />

      {loading ? (
        <div className="table-loading"><Spinner size={32} /><span>加载中...</span></div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState icon="user" title="暂无团队" description="点击右上角按钮创建第一个团队" />
      ) : (
        <div className="two-column">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>团队名称</th>
                  <th>描述</th>
                  <th>成员数</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team) => (
                  <tr
                    key={team.id}
                    className={`${selectedTeam?.id === team.id ? "table-row-clickable" : ""} table-row-clickable`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <td style={{ fontWeight: 500 }}>{team.name}</td>
                    <td className="truncate" style={{ maxWidth: 180 }}>{team.description || "-"}</td>
                    <td>{members.get(team.id)?.length || 0}</td>
                    <td>
                      <StatusDot color={team.isActive ? "green" : "gray"} />
                      <span style={{ marginLeft: 6, fontSize: 13 }}>{team.isActive ? "活跃" : "禁用"}</span>
                    </td>
                    <td>{new Date(team.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetailModal(team); }}>详情</Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openMemberModal(team); }}>成员</Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(team); }}>
                          <span style={{ color: "#dc2626" }}>删除</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTeam && (
            <div className="detail-panel">
              <div className="detail-panel-header">
                <h3 className="detail-panel-title">{selectedTeam.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTeam(null)}>关闭</Button>
              </div>
              <div className="detail-panel-body">
                <div className="detail-item">
                  <span className="detail-label">描述</span>
                  <span className="detail-value">{selectedTeam.description || "无"}</span>
                </div>
                <div className="detail-item" style={{ marginTop: 12 }}>
                  <span className="detail-label">成员 ({members.get(selectedTeam.id)?.length || 0})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {(members.get(selectedTeam.id) || []).map((member) => (
                    <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{getUserName(member.userId)}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{getUserEmail(member.userId)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {member.role && <Badge variant="info" size="sm">{roleLabels[member.role] || member.role}</Badge>}
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(selectedTeam.id, member.userId)}>
                          <span style={{ color: "#dc2626", fontSize: 12 }}>移除</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <select
                    className="form-input"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMember(selectedTeam.id, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    style={{ width: "100%" }}
                  >
                    <option value="">添加成员...</option>
                    {users.filter(u => !(members.get(selectedTeam.id)?.some(m => m.userId === u.id))).map((user) => (
                      <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 创建 Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建团队" size="md">
        <div className="form-group">
          <label className="form-label">团队名称</label>
          <input
            className="form-input"
            type="text"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            placeholder="输入团队名称"
          />
        </div>
        <div className="form-group">
          <label className="form-label">描述</label>
          <textarea
            className="form-input form-textarea"
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
            placeholder="团队描述..."
            rows={3}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
          <Button variant="primary" onClick={handleCreate}>创建</Button>
        </div>
      </Modal>

      {/* 成员角色管理 Modal */}
      <Modal open={showMemberModal} onClose={() => setShowMemberModal(false)} title={`成员管理 - ${selectedTeam?.name || ""}`} size="lg">
        {selectedTeam && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                共 {(members.get(selectedTeam.id) || []).length} 名成员
              </span>
              <select
                className="form-input"
                style={{ width: 200 }}
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMember(selectedTeam.id, e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">添加成员...</option>
                {users.filter(u => !(members.get(selectedTeam.id)?.some(m => m.userId === u.id))).map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
            {(members.get(selectedTeam.id) || []).length === 0 ? (
              <EmptyState icon="user" title="暂无成员" description="请从上方下拉菜单添加成员" />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>成员</th>
                      <th>邮箱</th>
                      <th>角色</th>
                      <th>加入时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(members.get(selectedTeam.id) || []).map((member) => (
                      <tr key={member.id}>
                        <td style={{ fontWeight: 500 }}>{getUserName(member.userId)}</td>
                        <td style={{ color: "#6b7280", fontSize: 13 }}>{getUserEmail(member.userId)}</td>
                        <td>
                          <select
                            className="form-input form-input-sm"
                            value={member.role || "member"}
                            onChange={(e) => handleUpdateMemberRole(selectedTeam.id, member.userId, e.target.value)}
                            disabled={memberRoleLoading}
                            style={{ width: 110 }}
                          >
                            {roleOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ fontSize: 13, color: "#6b7280" }}>
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(selectedTeam.id, member.userId)}>
                            <span style={{ color: "#dc2626" }}>移除</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 团队详情 Modal */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title={`团队详情 - ${selectedTeam?.name || ""}`} size="lg">
        {detailLoading ? (
          <div className="table-loading"><Spinner size={32} /><span>加载详情中...</span></div>
        ) : teamDetail ? (
          <div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">团队名称</span>
                <span className="detail-value">{teamDetail.team.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态</span>
                <span className="detail-value">
                  <StatusDot color={teamDetail.team.isActive ? "green" : "gray"} />
                  <span style={{ marginLeft: 6 }}>{teamDetail.team.isActive ? "活跃" : "禁用"}</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">创建时间</span>
                <span className="detail-value">{new Date(teamDetail.team.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">最后更新</span>
                <span className="detail-value">{new Date(teamDetail.team.updatedAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">成员数量</span>
                <span className="detail-value">{teamDetail.members.length} 人</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">关联租户</span>
                <span className="detail-value">{teamDetail.tenantName || "未关联"}</span>
              </div>
              <div className="detail-item detail-full">
                <span className="detail-label">描述</span>
                <span className="detail-value">{teamDetail.team.description || "无"}</span>
              </div>
              <div className="detail-item detail-full">
                <span className="detail-label">权限摘要</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  {teamDetail.permissions.map((perm) => (
                    <span key={perm} className="tag tag-blue">{perm}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon="info" title="无法加载详情" />
        )}
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除团队"
        message={`确定要删除团队 "${deleteTarget?.name}" 吗？团队中的所有成员将被移除。此操作不可撤销。`}
        variant="danger"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
