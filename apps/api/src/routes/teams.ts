import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { teamSchema, teamMemberSchema } from "../lib/validators";
import { teams, teamMembers } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("team:manage"), (req, res) => {
  const { tenantId } = req.user;
  const teamList = teams.findByTenantId(tenantId);
  res.json(teamList);
});

router.get("/:id", requirePermission("team:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const team = teams.get(id);
  
  if (!team) {
    throw new NotFoundError("团队不存在");
  }
  
  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const members = teamMembers.findByTeamId(id);
  res.json({ ...team, members });
});

router.post("/", requirePermission("team:manage"), validate(teamSchema), (req, res) => {
  const { tenantId } = req.user;
  const { name, description } = req.body;
  
  const newTeam = teams.create({
    tenantId,
    name,
    description,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  res.status(201).json(newTeam);
});

router.put("/:id", requirePermission("team:manage"), validate(teamSchema), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { name, description, isActive } = req.body;
  
  const team = teams.get(id);
  
  if (!team) {
    throw new NotFoundError("团队不存在");
  }
  
  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const updated = teams.update(id, {
    name,
    description,
    isActive,
    updatedAt: new Date().toISOString()
  });
  
  res.json(updated);
});

router.delete("/:id", requirePermission("team:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const team = teams.get(id);
  
  if (!team) {
    throw new NotFoundError("团队不存在");
  }
  
  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权删除该资源");
  }
  
  teams.delete(id);
  teamMembers.findByTeamId(id).forEach(member => teamMembers.delete(member.id));
  
  res.status(204).send();
});

router.get("/:id/members", requirePermission("team:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  
  const team = teams.get(id);
  
  if (!team) {
    throw new NotFoundError("团队不存在");
  }
  
  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权访问该资源");
  }
  
  const members = teamMembers.findByTeamId(id);
  res.json(members);
});

router.post("/:id/members", requirePermission("team:manage"), validate(teamMemberSchema), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const { userId, role } = req.body;
  
  const team = teams.get(id);
  
  if (!team) {
    throw new NotFoundError("团队不存在");
  }
  
  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const existingMember = teamMembers.findByFields({ teamId: id, userId });
  if (existingMember.length > 0) {
    throw new BadRequestError("用户已在团队中");
  }
  
  const newMember = teamMembers.addMember(id, userId, role);
  res.status(201).json(newMember);
});

router.delete("/:id/members/:userId", requirePermission("team:manage"), (req, res) => {
  const { id, userId } = req.params;
  const { tenantId } = req.user;
  
  const team = teams.get(id);
  
  if (!team) {
    throw new NotFoundError("团队不存在");
  }
  
  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }
  
  const success = teamMembers.removeMember(id, userId);
  
  if (!success) {
    throw new NotFoundError("团队成员不存在");
  }
  
  res.status(204).send();
});

export default router;