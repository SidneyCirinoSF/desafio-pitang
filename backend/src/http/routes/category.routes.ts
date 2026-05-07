import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { authMiddleware, requirePermission, PERMISSIONS } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post("/", requirePermission(PERMISSIONS.MANAGE_CATEGORIES), createCategory);
router.patch("/:id", requirePermission(PERMISSIONS.MANAGE_CATEGORIES), updateCategory);
router.delete("/:id", requirePermission(PERMISSIONS.MANAGE_CATEGORIES), deleteCategory);

export { router as categoryRoutes };
