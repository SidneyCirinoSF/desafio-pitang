import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../lib/jwt.js";

export interface AuthRequest extends Request {
  userId: string;
  userPerfil: string;
}

export const PERMISSIONS = {
  // COLLABORATOR
  CREATE_REQUEST: "create_request",
  VIEW_OWN_REQUEST: "view_own_request",
  EDIT_OWN_REQUEST: "edit_own_request",

  //EXCEPT COLLABORATOR
  VIEW_ALL_REQUESTS: "view_all_requests",

  //MANAGER
  APPROVE_REQUEST: "approve_request",
  REJECT_REQUEST: "reject_request",

  //FINANCE
  MARK_AS_PAID: "mark_as_paid",

  // admin
  MANAGE_USERS: "manage_users",
  MANAGE_CATEGORIES: "manage_categories",
  VIEW_REPORTS: "view_reports",
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  COLLABORATOR: [
    PERMISSIONS.CREATE_REQUEST,
    PERMISSIONS.VIEW_OWN_REQUEST,
    PERMISSIONS.EDIT_OWN_REQUEST,
  ],

  MANAGER: [PERMISSIONS.VIEW_ALL_REQUESTS, PERMISSIONS.APPROVE_REQUEST, PERMISSIONS.REJECT_REQUEST],

  FINANCE: [PERMISSIONS.VIEW_ALL_REQUESTS, PERMISSIONS.MARK_AS_PAID],

  ADMIN: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ALL_REQUESTS,
  ],
};

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token não fornecido" });
    return;
  }

  const token = header.slice(7);
  const payload = verifyToken(token);

  if (!payload.sub || !payload.perfil) {
    res.status(401).json({ message: "Token inválido" });
    return;
  }

  req.userId = payload.sub as string;
  req.userPerfil = payload.perfil as string;

  next();
}

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const perfil = req.userPerfil;

    if (!perfil) {
      res.status(403).json({ message: "Sem perfil" });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[perfil] || [];

    const hasPermission = permissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }

    next();
  };
}

export function requireOwnership(getResourceUserId: (req: AuthRequest) => Promise<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceUserId = await getResourceUserId(req);

      if (req.userId !== resourceUserId) {
        return res.status(403).json({ message: "Acesso a recurso não permitido" });
      }

      next();
    } catch {
      return res.status(500).json({ message: "Erro ao validar recurso" });
    }
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const perfil = req.userPerfil;
    const userPermissions = ROLE_PERMISSIONS[perfil] || [];

    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }

    next();
  };
}
