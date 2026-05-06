import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
  me,
} from "../controllers/user.controller.js";
import { authMiddleware, requirePermission, PERMISSIONS } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", authMiddleware, me);
router.post("/users", authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS), createUser);
router.get("/users", authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS), getUsers);
router.get("/users/:id", authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS), getUserById);
router.patch("/users/:id", authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS), updateUser);
router.delete(
  "/users/:id",
  authMiddleware,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  deleteUser,
);

export { router as userRoutes };
