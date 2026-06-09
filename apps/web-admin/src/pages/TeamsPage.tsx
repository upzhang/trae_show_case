import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Map<string, TeamMember[]>>(new Map());
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  async function fetchTeams() {
    setLoading(true);
    try {
      const response = await api.get("/teams");
      setTeams(response.data);
      
      const memberMap = new Map<string, TeamMember[]>();
      for (const team of response.data) {
        const membersResponse = await api.get(`/teams/${team.id}/members`);
        memberMap.set(team.id, membersResponse.data);
      }
      setMembers(memberMap);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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

  async function handleDelete(id: string) {
    if (confirm("确定要删除这个团队吗？")) {
      try {
        await api.delete(`/teams/${id}`);
        fetchTeams();
        if (selectedTeam?.id === id) {
          setSelectedTeam(null);
        }
      } catch (error) {
        console.error("Failed to delete team:", error);
      }
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

  function getUserName(userId: string): string {
    return users.find(u => u.id === userId)?.name || userId;
  }

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    t.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>团队管理</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          创建团队
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索团队..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="two-column">
          <div className="table-container">
            <table>
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
                    className={selectedTeam?.id === team.id ? "selected" : ""}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <td className="clickable">{team.name}</td>
                    <td className="truncate">{team.description || "-"}</td>
                    <td>{members.get(team.id)?.length || 0}</td>
                    <td>
                      <span className={`status ${team.isActive ? "active" : "inactive"}`}>
                        {team.isActive ? "活跃" : "禁用"}
                      </span>
                    </td>
                    <td>{new Date(team.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }} className="btn-danger">
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTeams.length === 0 && (
              <div className="empty-state">暂无团队</div>
            )}
          </div>

          {selectedTeam && (
            <div className="detail-panel">
              <div className="panel-header">
                <h2>{selectedTeam.name}</h2>
                <button onClick={() => setSelectedTeam(null)} className="btn-close">×</button>
              </div>
              <div className="detail-content">
                <div className="detail-row">
                  <span className="label">描述</span>
                  <p>{selectedTeam.description || "无"}</p>
                </div>
                <div className="detail-row">
                  <span className="label">成员</span>
                  <div className="member-list">
                    {(members.get(selectedTeam.id) || []).map((member) => (
                      <div key={member.id} className="member-item">
                        <span>{getUserName(member.userId)}</span>
                        {member.role && <span className="role">{member.role}</span>}
                        <button onClick={() => handleRemoveMember(selectedTeam!.id, member.userId)} className="btn-danger btn-sm">
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="add-member">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddMember(selectedTeam.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      placeholder="选择用户添加"
                    >
                      <option value="">添加成员...</option>
                      {users.filter(u => !(members.get(selectedTeam.id)?.some(m => m.userId === u.id))).map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建团队</h2>
            <div className="form-group">
              <label>团队名称</label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="输入团队名称"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="团队描述..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleCreate} className="btn-primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}