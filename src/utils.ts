import { PUBLIC_APP_URL } from "./config";
import type {
  BusinessNotification,
  BusinessType,
  BusinessUser,
  Campaign,
  Client,
  ClientStatus,
  Profile,
  Transaction,
} from "./types";
import { BUSINESS_TYPES } from "./types";

export function money(value: number) {
  const n = Math.round(Number(value || 0) * 100) / 100;
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " ₸";
}

export function compact(value: number) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000000)
    return (n / 1000000).toFixed(1).replace(".0", "") + " млн ₸";
  if (Math.abs(n) >= 10000) return Math.round(n / 1000) + " тыс ₸";
  return money(n);
}

export function dateNow() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function daysLeft(end: string) {
  const e = new Date(end + "T23:59:59").getTime();
  return Math.ceil((e - Date.now()) / 86400000);
}

export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export function clientStatus(purchases: number, spent: number): ClientStatus {
  if (purchases >= 6 || spent >= 100000) return "VIP";
  if (purchases >= 2) return "Активный";
  return "Обычный";
}

export function businessLabel(type: string) {
  const found = BUSINESS_TYPES.find((b) => b.value === type);
  return found ? found.label : type;
}

export function hue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

export function clientCode(id: string) {
  return (id || "").replace(/-/g, "").slice(0, 6).toUpperCase();
}

export function errorText(
  err: any,
  fallback = "Что-то пошло не так. Попробуйте ещё раз."
) {
  const msg: string = (err && (err.message || err.error_description)) || "";
  if (!msg) return fallback;
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, "Неверный email или пароль."],
    [/email not confirmed/i, "Почта ещё не подтверждена."],
    [
      /user already registered/i,
      "Этот email уже зарегистрирован. Войдите в аккаунт.",
    ],
    [
      /token has expired or is invalid/i,
      "Код неверный или устарел. Запросите новый.",
    ],
    [/otp.*expired/i, "Код устарел. Запросите новый."],
    [
      /password should be at least/i,
      "Пароль должен быть не короче 6 символов.",
    ],
    [
      /for security purposes, you can only request this after (\d+) seconds/i,
      "Слишком часто. Подождите немного и попробуйте снова.",
    ],
    [/rate limit/i, "Превышен лимит писем. Подождите и попробуйте позже."],
    [/unable to validate email address|invalid format/i, "Некорректный email."],
    [
      /error sending .*email/i,
      "Не удалось отправить письмо. Проверьте настройки SMTP в Supabase.",
    ],
    [
      /failed to fetch|network/i,
      "Нет соединения с сервером. Проверьте интернет.",
    ],
    [
      /new password should be different/i,
      "Новый пароль должен отличаться от старого.",
    ],
  ];
  for (const [re, text] of map) if (re.test(msg)) return text;
  return msg;
}

export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email || "",
    fullName: row.full_name || "",
    phone: row.phone || "",
    role: row.role === "admin" || row.role === "business" ? row.role : "client",
  };
}

export function mapBusiness(profile: Profile, row: any): BusinessUser {
  return {
    id: profile.id,
    ownerName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    companyName: row?.company_name || "Моя компания",
    businessType: (row?.business_type || "Coffee") as BusinessType,
    qrToken: row?.qr_token || "",
    cashbackRate: Number(row?.cashback_rate ?? 5),
  };
}

export function mapClient(row: any): Client {
  return {
    id: row.id,
    code: clientCode(row.id),
    companyId: row.company_id,
    userId: row.user_id || null,
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || null,
    status: (row.status || "Обычный") as ClientStatus,
    purchasesCount: Number(row.purchases_count || 0),
    totalSpent: Number(row.total_spent || 0),
    bonusesBalance: Number(row.bonuses_balance || 0),
    lastPurchaseDate: row.last_purchase_date || null,
    createdAt: row.created_at || dateNow(),
  };
}

export function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    companyId: row.company_id,
    clientId: row.client_id || null,
    type: row.type === "expense" ? "expense" : "income",
    amount: Number(row.amount || 0),
    category: row.category || "",
    date: row.date || dateNow(),
    description: row.description || "",
  };
}

export function mapCampaign(row: any): Campaign {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name || "",
    description: row.description || "",
    startDate: row.start_date || dateNow(),
    endDate: row.end_date || dateNow(),
    budget: Number(row.budget || 0),
    expectedRevenue: Number(row.expected_revenue || 0),
    status: row.status === "Завершена" ? "Завершена" : "Активна",
  };
}

export function mapBusinessNotification(row: any): BusinessNotification {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title || "Уведомление",
    message: row.message || "",
    isRead: !!row.is_read,
    createdAt: row.created_at || dateNow(),
  };
}

export function appUrl() {
  const base =
    PUBLIC_APP_URL.trim() || window.location.origin + window.location.pathname;
  return base.replace(/\/+$/, "") + "/";
}

export function buildJoinUrl(token: string) {
  return `${appUrl()}#join=${encodeURIComponent(token)}`;
}

export function readJoinToken(): string | null {
  const hash = window.location.hash || "";
  const direct = hash.match(/^#join=([^&]+)/);
  if (direct) return decodeURIComponent(direct[1]);
  const i = hash.indexOf("?");
  if (hash.startsWith("#join") && i >= 0) {
    const qr = new URLSearchParams(hash.slice(i + 1)).get("qr");
    if (qr) return qr;
  }
  const search = new URLSearchParams(window.location.search).get("qr");
  return search || null;
}

export function clearUrl() {
  window.history.replaceState({}, "", window.location.pathname);
}

export const storage = {
  get(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  },
};
