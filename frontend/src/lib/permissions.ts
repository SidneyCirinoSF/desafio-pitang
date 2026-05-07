import type { LucideIcon } from "lucide-react";
import { FileText, PlusCircle, Users, Tags } from "lucide-react";

export type Perfil = "COLLABORATOR" | "MANAGER" | "FINANCE" | "ADMIN";

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const MENU_ITEMS: Record<Perfil, MenuGroup[]> = {
  COLLABORATOR: [
    {
      label: "Reimbursements",
      items: [
        { title: "New Reimbursement", url: "/reimbursements/new", icon: PlusCircle },
        { title: "My Reimbursements", url: "/reimbursements", icon: FileText },
      ],
    },
  ],
  MANAGER: [
    {
      label: "Reimbursements",
      items: [{ title: "All Reimbursements", url: "/reimbursements", icon: FileText }],
    },
  ],
  FINANCE: [
    {
      label: "Reimbursements",
      items: [{ title: "All Reimbursements", url: "/reimbursements", icon: FileText }],
    },
  ],
  ADMIN: [
    {
      label: "Reimbursements",
      items: [{ title: "All Reimbursements", url: "/reimbursements", icon: FileText }],
    },
    {
      label: "Administration",
      items: [
        { title: "Users", url: "/users", icon: Users },
        { title: "Categories", url: "/categories", icon: Tags },
      ],
    },
  ],
};

export function getMenuItems(perfil: string): MenuGroup[] {
  return MENU_ITEMS[perfil as Perfil] ?? [];
}

export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reimbursements: "Reimbursements",
  new: "New Reimbursement",
  users: "Users",
  categories: "Categories",
};
