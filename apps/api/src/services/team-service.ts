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
  }
};