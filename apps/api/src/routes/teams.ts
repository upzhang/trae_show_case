import { Router } from "express";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { teamSchema, teamMemberSchema } from "../lib/validators";
import { teams, teamMembers } from "../store";
import { BadRequestError, NotFoundError } from "../lib/errors";

const router = Router();

router.get("/", requirePermission("team:manage"), (req, res) => {
  const { tenantId } = req.user;
  const { page, pageSize, search } = req.query as Record<string, string>;
  let teamList = req.user.roles.includes("platform_admin") ? teams.getAll() : teams.findByTenantId(tenantId);

  if (search) {
    const keyword = search.toLowerCase();
    teamList = teamList.filter((item) => item.name.toLowerCase().includes(keyword) || item.description?.toLowerCase().includes(keyword));
  }

  if (page || pageSize) {
    const currentPage = Number(page ?? 1);
    const currentPageSize = Number(pageSize ?? 20);
    const start = (currentPage - 1) * currentPageSize;
    res.json({
      data: teamList.slice(start, start + currentPageSize),
      total: teamList.length,
      page: currentPage,
      pageSize: currentPageSize
    });
    return;
  }

  res.json(teamList);
});

router.get("/user/:userId", requirePermission("team:manage"), (req, res) => {
  const { userId } = req.params;
  const memberships = teamMembers.findByUserId(userId);
  const userTeams = memberships
    .map((membership) => teams.get(membership.teamId))
    .filter(Boolean);
  res.json(userTeams);
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

  const duplicated = teams.findByTenantId(tenantId).some((team) => team.name === name);
  if (duplicated) {
    throw new BadRequestError("团队名称已存在");
  }
  
  const newTeam = teams.create({
    tenantId,
    name,
    description: description ?? null,
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

router.patch("/:id", requirePermission("team:manage"), (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const team = teams.get(id);

  if (!team) {
    throw new NotFoundError("团队不存在");
  }

  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }

  const updated = teams.update(id, {
    ...req.body,
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
  
  const newMember = teamMembers.addMember(id, userId, role ?? "member");
  res.status(201).json(newMember);
});

router.put("/:id/members/:userId", requirePermission("team:manage"), (req, res) => {
  const { id, userId } = req.params;
  const { tenantId } = req.user;
  const { role } = req.body;
  const team = teams.get(id);

  if (!team) {
    throw new NotFoundError("团队不存在");
  }

  if (team.tenantId !== tenantId && !req.user.roles.includes("platform_admin")) {
    throw new BadRequestError("无权修改该资源");
  }

  const member = teamMembers.findByFields({ teamId: id, userId })[0];
  if (!member) {
    throw new NotFoundError("团队成员不存在");
  }

  const updated = teamMembers.update(member.id, { role });
  res.json(updated);
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
