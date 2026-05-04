import { Router } from "express";
import {
  getReimbursements,
  getReimbursement,
  postReimbursement,
  patchReimbursement,
  submitReimbursement,
  approveReimbursement,
  rejectReimbursement,
  payReimbursement,
  getHistory,
  addAttachment,
  getAttachments,
} from "../controllers/reimbursement.controller.js";

import {
  authMiddleware,
  requirePermission,
  PERMISSIONS,
  requireAnyPermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// COLLABORATOR
router.get(
  "/",
  requireAnyPermission(PERMISSIONS.VIEW_OWN_REQUEST, PERMISSIONS.VIEW_ALL_REQUESTS),
  getReimbursements,
);
router.post("/", requirePermission(PERMISSIONS.CREATE_REQUEST), postReimbursement);
router.get(
  "/:id",
  requireAnyPermission(PERMISSIONS.VIEW_OWN_REQUEST, PERMISSIONS.VIEW_ALL_REQUESTS),
  getReimbursement,
);
router.patch("/:id", requirePermission(PERMISSIONS.EDIT_OWN_REQUEST), patchReimbursement);
router.post("/:id/submit", requirePermission(PERMISSIONS.EDIT_OWN_REQUEST), submitReimbursement);

// MANAGER
router.post("/:id/approve", requirePermission(PERMISSIONS.APPROVE_REQUEST), approveReimbursement);
router.post("/:id/reject", requirePermission(PERMISSIONS.REJECT_REQUEST), rejectReimbursement);

// FINANCE
router.post("/:id/pay", requirePermission(PERMISSIONS.MARK_AS_PAID), payReimbursement);

// GERAL
router.get(
  "/:id/history",
  requireAnyPermission(PERMISSIONS.VIEW_OWN_REQUEST, PERMISSIONS.VIEW_ALL_REQUESTS),
  getHistory,
);
router.post("/:id/attachments", requirePermission(PERMISSIONS.EDIT_OWN_REQUEST), addAttachment);
router.get(
  "/:id/attachments",
  requireAnyPermission(PERMISSIONS.VIEW_OWN_REQUEST, PERMISSIONS.VIEW_ALL_REQUESTS),
  getAttachments,
);

export { router as reimbursementRoutes };
