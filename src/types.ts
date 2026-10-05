export type Role = "admin" | "business" | "client";
export type BusinessType =
  | "Coffee"
  | "Restaurant"
  | "Beauty"
  | "Retail"
  | "Fitness";
export type TransactionType = "income" | "expense";
export type ClientStatus = "Обычный" | "Активный" | "VIP";
export type CampaignStatus = "Активна" | "Завершена";
export type AccountType = "business" | "client";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
}

export interface BusinessUser {
  id: string;
  ownerName: string;
  companyName: string;
  businessType: BusinessType;
  email: string;
  phone: string;
  qrToken: string;
  cashbackRate: number;
}

export interface Client {
  id: string;
  code: string;
  companyId: string;
  userId: string | null;
  name: string;
  phone: string;
  email: string | null;
  status: ClientStatus;
  purchasesCount: number;
  totalSpent: number;
  bonusesBalance: number;
  lastPurchaseDate: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  companyId: string;
  clientId: string | null;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface Campaign {
  id: string;
  companyId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  expectedRevenue: number;
  status: CampaignStatus;
}

export type NewTransaction = Omit<Transaction, "id" | "companyId" | "clientId">;
export type NewCampaign = Omit<Campaign, "id" | "companyId">;

export interface BusinessNotification {
  id: string;
  companyId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type Page =
  | "dashboard"
  | "clients"
  | "finances"
  | "campaigns"
  | "analytics"
  | "profile"
  | "qr"
  | "notifications";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "Coffee", label: "Кофейня" },
  { value: "Restaurant", label: "Ресторан / кафе" },
  { value: "Beauty", label: "Салон красоты" },
  { value: "Retail", label: "Магазин" },
  { value: "Fitness", label: "Фитнес" },
];
