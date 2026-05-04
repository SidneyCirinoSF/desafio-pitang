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
router.use(requirePermission(PERMISSIONS.MANAGE_CATEGORIES));

router.post("/", createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export { router as categoryRoutes };
