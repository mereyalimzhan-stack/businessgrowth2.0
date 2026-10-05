import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Coins,
  Megaphone,
  QrCode,
  ScanLine,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type {
  BusinessUser,
  Campaign,
  Client,
  Page,
  Transaction,
} from "../types";
import { clientStatus, compact, dateNow, formatDate, money } from "../utils";
import { Avatar, Empty, Stat, StatusBadge } from "../components/ui";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

export function TxRow({
  t,
  action,
}: {
  t: Transaction;
  action?: React.ReactNode;
}) {
  const income = t.type === "income";
  return (
    <div className="list-row">
      <div className={income ? "tx-icon in" : "tx-icon out"}>
        {income ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      </div>
      <div className="grow minw0">
        <b className="ellipsis block">{t.description || t.category}</b>
        <div className="muted ellipsis">
          {formatDate(t.date)} · {t.category}
        </div>
      </div>
      <strong className={income ? "pos" : "neg"}>
        {income ? "+" : "−"}
        {money(t.amount)}
      </strong>
      {action}
    </div>
  );
}

export default function HomeView({
  user,
  clients,
  transactions,
  campaigns,
  totalIncome,
  totalExpense,
  netProfit,
  setPage,
  onFindClient,
}: {
  user: BusinessUser;
  clients: Client[];
  transactions: Transaction[];
  campaigns: Campaign[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  setPage: (p: Page) => void;
  onFindClient: (q: string) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "Активна"
  ).length;
  const bonusesOut = clients.reduce((s, c) => s + c.bonusesBalance, 0);

  const days = useMemo(() => {
    const list: { key: string; label: string; value: number }[] = [];
    const today = new Date(dateNow() + "T12:00:00");
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      list.push({
        key,
        label: d.toLocaleDateString("ru-RU", { day: "numeric" }),
        value: 0,
      });
    }
    transactions.forEach((t) => {
      if (t.type !== "income") return;
      const day = list.find((d) => d.key === t.date);
      if (day) day.value += t.amount;
    });
    return list;
  }, [transactions]);

  const max = Math.max(...days.map((d) => d.value), 1);
  const periodTotal = days.reduce((s, d) => s + d.value, 0);
  const lastWeek = days.slice(7).reduce((s, d) => s + d.value, 0);
  const prevWeek = days.slice(0, 7).reduce((s, d) => s + d.value, 0);
  const trend =
    prevWeek > 0
      ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100)
      : lastWeek > 0
      ? 100
      : 0;

  const topClients = useMemo(
    () => [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    [clients]
  );
  const shown = hover !== null ? days[hover] : null;

  return (
    <div className="page">
      <section className="hero-card">
        <div className="hero-card-glow" />
        <div className="minw0">
          <span className="eyebrow">
            {new Date().toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
          <h2>
            {greeting()}, {user.ownerName || "друг"}
          </h2>
          <p>
            {clients.length === 0
              ? "Покажите клиентам QR-код — первые участники программы появятся здесь."
              : `В программе ${clients.length} клиентов. На их балансах ${money(
                  bonusesOut
                )} бонусов — это повод вернуться.`}
          </p>
        </div>
        <button className="btn btn-lime" onClick={() => setPage("qr")}>
          <QrCode size={18} /> QR для кассы
        </button>
      </section>

      <form
        className="card cashier"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) onFindClient(query.trim().replace(/^#/, ""));
        }}
      >
        <span className="cashier-icon">
          <ScanLine size={20} />
        </span>
        <div className="cashier-text">
          <b>Касса</b>
          <span className="muted">
            Введите код клиента или телефон — сразу откроется покупка
          </span>
        </div>
        <label className="search-box grow">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например, C0A1B2"
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!query.trim()}
        >
          Найти
        </button>
      </form>

      <div className="stat-grid">
        <Stat
          title="Клиенты"
          value={clients.length}
          icon={<Users size={18} />}
          tone="cyan"
          hint={`${clients.filter((c) => c.userId).length} через QR`}
        />
        <Stat
          title="Доходы"
          value={totalIncome}
          format={compact}
          icon={<TrendingUp size={18} />}
          tone="lime"
        />
        <Stat
          title="Расходы"
          value={totalExpense}
          format={compact}
          icon={<TrendingDown size={18} />}
          tone="pink"
        />
        <Stat
          title="Прибыль"
          value={netProfit}
          format={compact}
          icon={<Wallet size={18} />}
          tone={netProfit >= 0 ? "violet" : "red"}
          hint={
            activeCampaigns > 0
              ? `${activeCampaigns} акц. сейчас активно`
              : undefined
          }
        />
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Выручка за 14 дней</h2>
              <div className="chart-total">
                {shown ? money(shown.value) : money(periodTotal)}
                {!shown && trend !== 0 && (
                  <span className={trend > 0 ? "trend up" : "trend down"}>
                    {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                  </span>
                )}
              </div>
              <p className="muted">
                {shown ? formatDate(shown.key) : "неделя к неделе"}
              </p>
            </div>
          </div>
          <div
            className="bars"
            role="img"
            aria-label="График выручки"
            onMouseLeave={() => setHover(null)}
          >
            {days.map((d, i) => (
              <div
                key={d.key}
                className={hover === i ? "bar-col active" : "bar-col"}
                onMouseEnter={() => setHover(i)}
                onClick={() => setHover(i)}
              >
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      height: `${
                        d.value ? Math.max((d.value / max) * 100, 5) : 0
                      }%`,
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                </div>
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Лучшие клиенты</h2>
            <button className="link-inline" onClick={() => setPage("clients")}>
              Все <ArrowRight size={14} />
            </button>
          </div>
          {topClients.length === 0 ? (
            <Empty
              icon={<Users size={20} />}
              title="Пока пусто"
              text="Клиенты появятся после регистрации по QR."
            />
          ) : (
            <div className="list">
              {topClients.map((c, i) => (
                <div key={c.id} className="list-row">
                  <span className="rank">{i + 1}</span>
                  <Avatar name={c.name} size="sm" />
                  <div className="grow minw0">
                    <b className="ellipsis block">{c.name}</b>
                    <div className="muted">{money(c.totalSpent)}</div>
                  </div>
                  <StatusBadge
                    status={clientStatus(c.purchasesCount, c.totalSpent)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Последние операции</h2>
          <button className="link-inline" onClick={() => setPage("finances")}>
            Все <ArrowRight size={14} />
          </button>
        </div>
        {transactions.length === 0 ? (
          <Empty
            icon={<Coins size={20} />}
            title="Операций пока нет"
            text="Проведите покупку клиента или добавьте доход вручную."
          />
        ) : (
          <div className="list">
            {transactions.slice(0, 5).map((t) => (
              <TxRow key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>

      {campaigns.length === 0 && (
        <div className="card nudge">
          <span className="nudge-icon">
            <Megaphone size={20} />
          </span>
          <div className="grow">
            <b>Запустите первую акцию</b>
            <div className="muted">
              Все клиенты программы получат уведомление в своём кабинете.
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage("campaigns")}
          >
            Создать <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
