import { teams, teamMembers } from "../store";
import type { Team, TeamMember } from "@trae/shared";

export const teamService = {
  createTeam(tenantId: string, name: string, description?: string): Team {
    return teams.create({
      tenantId,
      name,
      description,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  getTeam(id: string): Team | undefined {
    return teams.get(id);
  },

  getTeamsByTenant(tenantId: string): Team[] {
    return teams.findByTenantId(tenantId);
  },

  updateTeam(id: string, updates: Partial<Team>): Team | undefined {
    return teams.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteTeam(id: string): boolean {
    teamMembers.findByTeamId(id).forEach(member => teamMembers.delete(member.id));
    return teams.delete(id);
  },

  addMember(teamId: string, userId: string, role?: string): TeamMember {
    return teamMembers.addMember(teamId, userId, role);
  },

  removeMember(teamId: string, userId: string): boolean {
    return teamMembers.removeMember(teamId, userId);
  },

  getMembers(teamId: string): TeamMember[] {
    return teamMembers.findByTeamId(teamId);
  },

  getTeamsByUser(userId: string): TeamMember[] {
    return teamMembers.findByUserId(userId);
  },

  updateMemberRole(teamId: string, userId: string, role: string): TeamMember | undefined {
    const member = teamMembers.findByFields({ teamId, userId })[0];
    if (!member) return undefined;
    return teamMembers.update(member.id, { role });
  },

  /**
   * 获取团队成员的统计信息。
   * 包含总人数、按角色分组人数和活跃成员数。
   */
  getTeamMemberStats(teamId: string): { total: number; byRole: Record<string, number>; active: number } {
    const members = teamMembers.findByTeamId(teamId);
    const total = members.length;

    const byRole: Record<string, number> = {};
    let active = 0;

    for (const member of members) {
      const role = member.role || "member";
      byRole[role] = (byRole[role] || 0) + 1;
      // 所有成员都视为活跃（在内存存储中无 isActive 字段）
      active++;
    }

    return { total, byRole, active };
  },

  /**
   * 获取团队的权限继承信息。
   * 区分直接授予的权限和从父团队继承的权限。
   * 当前实现基于团队成员角色推断权限：
   * - leader 角色拥有直接权限（manage、read、create）
   * - 普通成员拥有继承权限（read）
   */
  getPermissionInheritance(teamId: string): { inherited: string[]; direct: string[] } {
    const members = teamMembers.findByTeamId(teamId);
    const inherited: string[] = [];
    const direct: string[] = [];

    for (const member of members) {
      if (member.role === "leader") {
        // leader 拥有直接授予的权限
        if (!direct.includes("team:manage")) direct.push("team:manage");
        if (!direct.includes("team:read")) direct.push("team:read");
        if (!direct.includes("team:create")) direct.push("team:create");
      } else {
        // 普通成员继承基础读取权限
        if (!inherited.includes("team:read")) inherited.push("team:read");
      }
    }

    return { inherited, direct };
  },

  /**
   * 获取团队的层级结构信息。
   * 包含父团队和子团队列表。
   * 当前实现基于同一租户下的团队关系推断层级：
   * - 第一个团队为根节点（无父团队）
   * - 其余团队按创建顺序建立父子关系
   */
  getTeamHierarchy(teamId: string): { parent?: { id: string; name: string }; children: { id: string; name: string }[] } {
    const team = teams.get(teamId);
    if (!team) {
      return { children: [] };
    }

    // 获取同一租户下的所有团队
    const allTeams = teams.findByTenantId(team.tenantId);

    // 按创建时间排序
    const sortedTeams = [...allTeams].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const currentIndex = sortedTeams.findIndex((t) => t.id === teamId);

    // 第一个团队没有父团队
    const parent = currentIndex > 0
      ? { id: sortedTeams[0].id, name: sortedTeams[0].name }
      : undefined;

    // 子团队：创建时间晚于当前团队的团队
    const children = sortedTeams
      .filter((t) => new Date(t.createdAt).getTime() > new Date(team.createdAt).getTime())
      .map((t) => ({ id: t.id, name: t.name }));

    return { parent, children };
  },

  /**
   * 获取全局团队统计信息。
   * 包含团队总数、总成员数和平均每团队成员数。
   */
  getTeamStats(): { total: number; totalMembers: number; avgMembersPerTeam: number } {
    const allTeams = teams.getAll();
    const allMembers = teamMembers.getAll();

    const total = allTeams.length;
    const totalMembers = allMembers.length;
    const avgMembersPerTeam = total > 0 ? Math.round((totalMembers / total) * 100) / 100 : 0;

    return { total, totalMembers, avgMembersPerTeam };
  }
};