import React, { useState } from "react";
import {
  Bell,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MoreHorizontal,
  QrCode,
  RefreshCw,
  Settings,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type {
  BusinessNotification,
  BusinessUser,
  Campaign,
  Client,
  NewCampaign,
  NewTransaction,
  Page,
  Transaction,
} from "../types";
import { Avatar, Brand } from "../components/ui";
import HomeView from "../views/Home";
import ClientsView from "../views/Clients";
import FinancesView from "../views/Finances";
import CampaignsView from "../views/Campaigns";
import {
  AnalyticsView,
  NotificationsView,
  ProfileView,
  QRView,
} from "../views/Extras";

export interface DashboardActions {
  logout: () => void;
  updateBusiness: (u: BusinessUser) => Promise<void>;
  regenerateQr: () => Promise<void>;
  addClient: (d: {
    name: string;
    phone: string;
    email: string;
  }) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addPurchase: (c: Client, amount: number) => Promise<void>;
  redeemBonuses: (c: Client, amount: number) => Promise<void>;
  addTransaction: (d: NewTransaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCampaign: (d: NewCampaign) => Promise<void>;
  toggleCampaign: (c: Campaign) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  startOnboarding: () => void;
}

interface Props {
  user: BusinessUser;
  page: Page;
  setPage: (p: Page) => void;
  clients: Client[];
  transactions: Transaction[];
  campaigns: Campaign[];
  notifications: BusinessNotification[];
  actions: DashboardActions;
}

const MENU: {
  id: Page;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "dashboard",
    title: "Главная",
    subtitle: "Обзор бизнеса",
    icon: <LayoutDashboard size={19} />,
  },
  {
    id: "clients",
    title: "Клиенты",
    subtitle: "CRM и бонусы",
    icon: <Users size={19} />,
  },
  {
    id: "finances",
    title: "Финансы",
    subtitle: "Доходы и расходы",
    icon: <Wallet size={19} />,
  },
  {
    id: "campaigns",
    title: "Акции",
    subtitle: "Кампании и рассылки",
    icon: <Megaphone size={19} />,
  },
  {
    id: "analytics",
    title: "Аналитика",
    subtitle: "Рекомендации",
    icon: <Sparkles size={19} />,
  },
  {
    id: "qr",
    title: "QR-код",
    subtitle: "Для кассы и столов",
    icon: <QrCode size={19} />,
  },
  {
    id: "notifications",
    title: "Уведомления",
    subtitle: "События",
    icon: <Bell size={19} />,
  },
  {
    id: "profile",
    title: "Профиль",
    subtitle: "Настройки компании",
    icon: <Settings size={19} />,
  },
];

const MOBILE_MAIN: Page[] = ["dashboard", "clients", "finances", "campaigns"];

export default function Dashboard(props: Props) {
  const {
    user,
    page,
    setPage,
    clients,
    transactions,
    campaigns,
    notifications,
    actions,
  } = props;
  const [moreOpen, setMoreOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clientQuery, setClientQuery] = useState("");

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const unread = notifications.filter((n) => !n.isRead).length;
  const current = MENU.find((m) => m.id === page) || MENU[0];

  function go(p: Page) {
    if (p !== "clients") setClientQuery("");
    setPage(p);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refresh() {
    setRefreshing(true);
    await actions.refresh();
    setRefreshing(false);
  }

  const badgeFor = (id: Page) => (id === "notifications" ? unread : 0);

  return (
    <div className="shell">
      <aside className="sidebar glass">
        <Brand subtitle={user.companyName} />
        <nav className="nav">
          {MENU.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "nav-item active" : "nav-item"}
              onClick={() => go(item.id)}
            >
              {item.icon}
              <span className="grow">{item.title}</span>
              {item.id === "clients" && clients.length > 0 && (
                <span className="nav-count">{clients.length}</span>
              )}
              {badgeFor(item.id) > 0 && (
                <span className="nav-badge">{badgeFor(item.id)}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-card">
          <div className="side-card-rate">{user.cashbackRate}%</div>
          <div>
            <b>Кэшбэк</b>
            <p>Возвращается клиентам бонусами</p>
          </div>
        </div>
        <div className="side-foot">
          <button className="nav-item" onClick={actions.startOnboarding}>
            <GraduationCap size={19} />
            <span>Обучение</span>
          </button>
          <button className="nav-item" onClick={actions.logout}>
            <LogOut size={19} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title minw0">
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
          </div>
          <div className="row gap">
            <button
              className="icon-btn ghost"
              onClick={refresh}
              aria-label="Обновить данные"
              title="Обновить"
            >
              <RefreshCw size={18} className={refreshing ? "spin" : ""} />
            </button>
            <button
              className="icon-btn ghost"
              onClick={() => go("notifications")}
              aria-label="Уведомления"
            >
              <Bell size={19} />
              {unread > 0 && <span className="bell-dot">{unread}</span>}
            </button>
            <button
              className="avatar-btn"
              onClick={() => go("profile")}
              aria-label="Профиль"
            >
              <Avatar name={user.ownerName || user.companyName} size="sm" />
            </button>
          </div>
        </header>

        <div className="content" key={page}>
          {page === "dashboard" && (
            <HomeView
              user={user}
              clients={clients}
              transactions={transactions}
              campaigns={campaigns}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netProfit={netProfit}
              setPage={go}
              onFindClient={(q) => {
                setClientQuery(q);
                go("clients");
              }}
            />
          )}
          {page === "clients" && (
            <ClientsView
              clients={clients}
              cashbackRate={user.cashbackRate}
              onAddClient={actions.addClient}
              onDeleteClient={actions.deleteClient}
              onAddPurchase={actions.addPurchase}
              onRedeem={actions.redeemBonuses}
              onShowQr={() => go("qr")}
              initialSearch={clientQuery}
            />
          )}
          {page === "finances" && (
            <FinancesView
              transactions={transactions}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netProfit={netProfit}
              onAddTransaction={actions.addTransaction}
              onDeleteTransaction={actions.deleteTransaction}
            />
          )}
          {page === "campaigns" && (
            <CampaignsView
              campaigns={campaigns}
              reach={clients.filter((c) => c.userId).length}
              onAddCampaign={actions.addCampaign}
              onToggleCampaign={actions.toggleCampaign}
              onDeleteCampaign={actions.deleteCampaign}
            />
          )}
          {page === "analytics" && (
            <AnalyticsView
              clients={clients}
              transactions={transactions}
              campaigns={campaigns}
            />
          )}
          {page === "qr" && (
            <QRView user={user} onRegenerate={actions.regenerateQr} />
          )}
          {page === "notifications" && (
            <NotificationsView
              notifications={notifications}
              onMarkRead={actions.markNotificationRead}
              onMarkAll={actions.markAllRead}
            />
          )}
          {page === "profile" && (
            <ProfileView
              user={user}
              onSave={actions.updateBusiness}
              onLogout={actions.logout}
            />
          )}
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Навигация">
        {MENU.filter((m) => MOBILE_MAIN.includes(m.id)).map((item) => (
          <button
            key={item.id}
            className={page === item.id ? "bn-item active" : "bn-item"}
            onClick={() => go(item.id)}
          >
            {item.icon}
            <span>{item.title}</span>
          </button>
        ))}
        <button
          className={!MOBILE_MAIN.includes(page) ? "bn-item active" : "bn-item"}
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal size={19} />
          <span>Ещё</span>
          {unread > 0 && <i className="bn-dot" />}
        </button>
      </nav>

      {moreOpen && (
        <div className="modal-overlay" onMouseDown={() => setMoreOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-grip" />
            <div className="modal-head">
              <h3>Меню</h3>
              <button
                className="icon-btn"
                onClick={() => setMoreOpen(false)}
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
            <div className="sheet-list">
              {MENU.filter((m) => !MOBILE_MAIN.includes(m.id)).map((item) => (
                <button
                  key={item.id}
                  className="sheet-item"
                  onClick={() => go(item.id)}
                >
                  <span className="sheet-icon">{item.icon}</span>
                  <span className="grow">
                    <b>{item.title}</b>
                    <small>{item.subtitle}</small>
                  </span>
                  {badgeFor(item.id) > 0 && (
                    <span className="nav-badge">{badgeFor(item.id)}</span>
                  )}
                </button>
              ))}
              <button
                className="sheet-item"
                onClick={() => {
                  setMoreOpen(false);
                  actions.startOnboarding();
                }}
              >
                <span className="sheet-icon">
                  <GraduationCap size={19} />
                </span>
                <span className="grow">
                  <b>Обучение</b>
                  <small>Как всё устроено</small>
                </span>
              </button>
              <button className="sheet-item danger" onClick={actions.logout}>
                <span className="sheet-icon">
                  <LogOut size={19} />
                </span>
                <span className="grow">
                  <b>Выйти</b>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
