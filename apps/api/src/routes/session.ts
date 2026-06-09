import { Router } from "express";

import { store } from "../store";

const router = Router();

router.get("/api/session/me", (req, res) => {
  const userId = req.currentUserId;
  if (!userId) {
    res.status(401).json({ error: "not signed in" });
    return;
  }
  const user = store.users.find((item) => item.id === userId);
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, roles: user.roles, tenantId: user.tenantId });
});

router.get("/api/users/by-email/:email", (req, res) => {
  const user = store.users.find((item) => item.email === req.params.email);
  if (!user) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, roles: user.roles, tenantId: user.tenantId });
});

export default router;
