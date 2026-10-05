import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Lightbulb,
  LogOut,
  Mail,
  Percent,
  RefreshCw,
  Receipt,
  Repeat,
  Share2,
  Users,
} from "lucide-react";
import type {
  BusinessNotification,
  BusinessType,
  BusinessUser,
  Campaign,
  Client,
  Transaction,
} from "../types";
import { BUSINESS_TYPES } from "../types";
import {
  buildJoinUrl,
  clientStatus,
  compact,
  formatDate,
  money,
} from "../utils";
import { Empty, Input, Select, Spinner, Stat } from "../components/ui";

export function AnalyticsView({
  clients,
  transactions,
  campaigns,
}: {
  clients: Client[];
  transactions: Transaction[];
  campaigns: Campaign[];
}) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const purchases = clients.reduce((s, c) => s + c.purchasesCount, 0);
  const spent = clients.reduce((s, c) => s + c.totalSpent, 0);
  const avgCheck = purchases > 0 ? Math.round(spent / purchases) : 0;
  const repeat = clients.filter((c) => c.purchasesCount >= 2).length;
  const repeatRate = clients.length
    ? Math.round((repeat / clients.length) * 100)
    : 0;
  const statuses = { VIP: 0, Активный: 0, Обычный: 0 } as Record<
    string,
    number
  >;
  clients.forEach(
    (c) => (statuses[clientStatus(c.purchasesCount, c.totalSpent)] += 1)
  );
  const sleeping = clients.filter(
    (c) =>
      c.lastPurchaseDate &&
      Date.now() - new Date(c.lastPurchaseDate).getTime() > 30 * 86400000
  ).length;

  const expenseByCat: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach(
      (t) =>
        (expenseByCat[t.category] = (expenseByCat[t.category] || 0) + t.amount)
    );
  const cats = Object.keys(expenseByCat)
    .map((k) => ({ name: k, value: expenseByCat[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const insights = [
    {
      title: "База клиентов",
      text:
        clients.length < 3
          ? "Клиентов пока мало. Поставьте QR-код у кассы и говорите о кэшбэке при каждой оплате."
          : repeatRate < 40
          ? `Возвращаются ${repeatRate}% клиентов. Запустите акцию для тех, кто был только один раз.`
          : `Возвращаются ${repeatRate}% клиентов — отличный результат. Порадуйте VIP персональным предложением.`,
    },
    {
      title: "Спящие клиенты",
      text:
        sleeping > 0
          ? `${sleeping} клиентов не приходили больше месяца. Акция «двойной кэшбэк» поможет их вернуть.`
          : "Все активные клиенты заходили в последний месяц. Так держать!",
    },
    {
      title: "Финансы",
      text:
        income === 0
          ? "Проведите первые покупки — здесь появится оценка прибыльности."
          : expense > income
          ? "Расходы выше доходов. Посмотрите крупнейшие статьи затрат ниже."
          : `Прибыль ${money(
              income - expense
            )}. Можно выделить около 10% на маркетинг.`,
    },
    {
      title: "Акции",
      text:
        campaigns.length === 0
          ? "Акций ещё не было. Начните с простой — скидка по будням хорошо работает для кофеен и салонов."
          : `Запущено акций: ${campaigns.length}. Сравнивайте выручку до и после, чтобы понять, какие работают.`,
    },
  ];

  const total = clients.length || 1;
  const catMax = Math.max(...cats.map((c) => c.value), 1);

  return (
    <div className="page">
      <div className="stat-grid">
        <Stat
          title="Средний чек"
          value={avgCheck}
          format={money}
          icon={<Receipt size={18} />}
          tone="violet"
        />
        <Stat
          title="Возвращаются"
          value={repeatRate}
          format={(n) => `${n}%`}
          icon={<Repeat size={18} />}
          tone="cyan"
        />
        <Stat
          title="VIP"
          value={statuses.VIP}
          icon={<Crown size={18} />}
          tone="amber"
        />
        <Stat
          title="Клиентов"
          value={clients.length}
          icon={<Users size={18} />}
          tone="lime"
        />
      </div>

      <div className="two-col">
        <div className="card">
          <h2 className="card-title">Сегменты клиентов</h2>
          <div className="segment-bar">
            <span
              className="seg vip"
              style={{ width: `${(statuses.VIP / total) * 100}%` }}
            />
            <span
              className="seg active"
              style={{ width: `${(statuses["Активный"] / total) * 100}%` }}
            />
            <span
              className="seg basic"
              style={{ width: `${(statuses["Обычный"] / total) * 100}%` }}
            />
          </div>
          <div className="legend">
            <span>
              <i className="dot-vip" /> VIP · {statuses.VIP}
            </span>
            <span>
              <i className="dot-active" /> Активные · {statuses["Активный"]}
            </span>
            <span>
              <i className="dot-basic" /> Новые · {statuses["Обычный"]}
            </span>
          </div>
          <h2 className="card-title mt-lg">Куда уходят деньги</h2>
          {cats.length === 0 ? (
            <p className="muted mt">Расходов пока нет.</p>
          ) : (
            <div className="hbars">
              {cats.map((c) => (
                <div key={c.name} className="hbar">
                  <div className="row between">
                    <span>{c.name}</span>
                    <b>{compact(c.value)}</b>
                  </div>
                  <div className="hbar-track">
                    <span style={{ width: `${(c.value / catMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Рекомендации</h2>
          <div className="stack mt">
            {insights.map((i) => (
              <div key={i.title} className="insight">
                <span className="insight-icon">
                  <Lightbulb size={17} />
                </span>
                <div>
                  <b>{i.title}</b>
                  <p>{i.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function QRView({
  user,
  onRegenerate,
}: {
  user: BusinessUser;
  onRegenerate: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qrUrl = user.qrToken ? buildJoinUrl(user.qrToken) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте ссылку:", qrUrl);
    }
  }

  async function share() {
    const nav: any = navigator;
    if (nav.share) {
      try {
        await nav.share({
          title: user.companyName,
          text: `Кэшбэк ${user.cashbackRate}% в «${user.companyName}»`,
          url: qrUrl,
        });
      } catch {}
    } else copy();
  }

  async function downloadPoster() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      const data = new XMLSerializer().serializeToString(svg);
      const img = await loadImage(
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data)
      );
      const W = 1240;
      const H = 1754;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#1a0b3b");
      bg.addColorStop(0.55, "#0b0d1f");
      bg.addColorStop(1, "#04232b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(
        W * 0.85,
        120,
        0,
        W * 0.85,
        120,
        700
      );
      glow.addColorStop(0, "rgba(139,92,246,0.55)");
      glow.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      const glow2 = ctx.createRadialGradient(80, H - 100, 0, 80, H - 100, 700);
      glow2.addColorStop(0, "rgba(34,211,238,0.35)");
      glow2.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.fillStyle = "#d4ff3f";
      ctx.font = "700 44px Manrope, sans-serif";
      ctx.fillText("ПРОГРАММА ЛОЯЛЬНОСТИ", W / 2, 190);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 92px Unbounded, Manrope, sans-serif";
      ctx.fillText(user.companyName.slice(0, 22), W / 2, 320);
      ctx.font = "600 150px Unbounded, Manrope, sans-serif";
      const rateGrad = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
      rateGrad.addColorStop(0, "#a78bfa");
      rateGrad.addColorStop(1, "#22d3ee");
      ctx.fillStyle = rateGrad;
      ctx.fillText(`${user.cashbackRate}% кэшбэк`, W / 2, 500);

      const box = 760;
      const bx = (W - box) / 2;
      const by = 590;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, bx, by, box, box, 56);
      ctx.fill();
      ctx.drawImage(img, bx + 60, by + 60, box - 120, box - 120);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 60px Manrope, sans-serif";
      ctx.fillText("Наведите камеру телефона", W / 2, by + box + 130);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "500 42px Manrope, sans-serif";
      ctx.fillText(
        "регистрация за 20 секунд · бонусы с каждой покупки",
        W / 2,
        by + box + 200
      );

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-${user.companyName || "company"}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    if (
      !window.confirm(
        "Создать новый QR-код? Старые распечатки перестанут работать."
      )
    )
      return;
    setBusy(true);
    await onRegenerate();
    setBusy(false);
  }

  return (
    <div className="page">
      <div className="card qr-layout">
        <div className="qr-stage">
          <div className="qr-ring" />
          <div className="qr-frame" ref={ref}>
            {qrUrl ? (
              <QRCodeSVG
                value={qrUrl}
                size={260}
                level="M"
                fgColor="#0b0d1f"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            ) : (
              <Spinner size={30} />
            )}
          </div>
        </div>
        <div className="qr-info">
          <span className="eyebrow">QR для кассы и столов</span>
          <h2 className="qr-title">{user.companyName}</h2>
          <p className="muted">
            Клиент наводит камеру, регистрируется и подтверждает почту кодом.
            После этого он сразу в вашей программе с кэшбэком{" "}
            <b className="lime-text">{user.cashbackRate}%</b>.
          </p>
          <div className="link-box">{qrUrl}</div>
          <div className="row gap wrap">
            <button
              className="btn btn-primary"
              onClick={downloadPoster}
              disabled={busy || !qrUrl}
            >
              <Download size={17} /> Скачать постер
            </button>
            <button
              className="btn btn-secondary"
              onClick={copy}
              disabled={!qrUrl}
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
              {copied ? "Скопировано" : "Ссылка"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={share}
              disabled={!qrUrl}
            >
              <Share2 size={17} />
            </button>
            <a
              className="btn btn-secondary"
              href={qrUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Открыть ссылку"
            >
              <ExternalLink size={17} />
            </a>
          </div>
          <button
            className="link-inline danger-link"
            onClick={regenerate}
            disabled={busy}
          >
            <RefreshCw size={14} /> Сгенерировать новый код
          </button>
        </div>
      </div>

      <div className="steps">
        {[
          [
            "1",
            "Скачайте постер",
            "Распечатайте и поставьте у кассы или на столы.",
          ],
          [
            "2",
            "Клиент сканирует",
            "Регистрация и подтверждение почты кодом — 20 секунд.",
          ],
          [
            "3",
            "Покупки → бонусы",
            "В разделе «Клиенты» нажмите «Покупка» — кэшбэк начислится сам.",
          ],
        ].map(([n, t, d]) => (
          <div key={n} className="step">
            <span className="step-n">{n}</span>
            <b>{t}</b>
            <p className="muted">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileView({
  user,
  onSave,
  onLogout,
}: {
  user: BusinessUser;
  onSave: (u: BusinessUser) => Promise<void>;
  onLogout: () => void;
}) {
  const [ownerName, setOwnerName] = useState(user.ownerName);
  const [companyName, setCompanyName] = useState(user.companyName);
  const [businessType, setBusinessType] = useState<BusinessType>(
    user.businessType
  );
  const [phone, setPhone] = useState(user.phone);
  const [cashbackRate, setCashbackRate] = useState(String(user.cashbackRate));
  const [saving, setSaving] = useState(false);
  const rate = Math.min(100, Math.max(0, Number(cashbackRate) || 0));

  return (
    <div className="two-col profile-grid">
      <div className="card">
        <h2 className="card-title">Профиль компании</h2>
        <form
          className="mt"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSave({
              ...user,
              ownerName: ownerName.trim(),
              companyName: companyName.trim(),
              businessType,
              phone: phone.trim(),
              cashbackRate: rate,
            });
            setSaving(false);
          }}
        >
          <div className="form-row">
            <Input
              label="Имя владельца"
              value={ownerName}
              onChange={setOwnerName}
            />
            <Input
              label="Телефон"
              type="tel"
              value={phone}
              onChange={setPhone}
              required={false}
            />
          </div>
          <div className="form-row">
            <Input
              label="Название компании"
              value={companyName}
              onChange={setCompanyName}
            />
            <Select
              label="Сфера"
              value={businessType}
              onChange={setBusinessType}
              options={BUSINESS_TYPES}
            />
          </div>
          <Input
            label="Email для входа"
            value={user.email}
            onChange={() => {}}
            disabled
            icon={<Mail size={17} />}
          />
          <div className="field">
            <span className="field-label">Кэшбэк: {rate}%</span>
            <div className="range-row">
              <input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={rate}
                onChange={(e) => setCashbackRate(e.target.value)}
                className="range"
                style={{ ["--p" as any]: `${(rate / 30) * 100}%` }}
              />
              <span className="input-wrap range-num">
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={cashbackRate}
                  onChange={(e) => setCashbackRate(e.target.value)}
                />
                <Percent size={15} />
              </span>
            </div>
            <span className="field-hint">
              С покупки на 10 000 ₸ клиент получит {money((10000 * rate) / 100)}{" "}
              бонусами.
            </span>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? <Spinner /> : "Сохранить изменения"}
          </button>
        </form>
      </div>
      <div className="card profile-side">
        <div className="profile-rate">{rate}%</div>
        <p className="muted">текущий кэшбэк</p>
        <div className="divider" />
        <p className="muted small">
          Смена процента действует на новые покупки. Уже начисленные бонусы не
          меняются.
        </p>
        <button className="btn btn-secondary btn-block" onClick={onLogout}>
          <LogOut size={17} /> Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}

export function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAll,
}: {
  notifications: BusinessNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAll: () => Promise<void>;
}) {
  const unread = notifications.filter((n) => !n.isRead).length;
  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">Уведомления</h2>
        {unread > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={onMarkAll}>
            <CheckCheck size={16} /> Прочитать все
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty
          icon={<BellOff size={22} />}
          title="Уведомлений нет"
          text="Здесь появятся новые клиенты и важные события."
        />
      ) : (
        <div className="stack">
          {notifications.map((n) => (
            <button
              key={n.id}
              className={n.isRead ? "notif read" : "notif"}
              onClick={() => !n.isRead && onMarkRead(n.id)}
            >
              <span className="notif-icon">
                <Bell size={16} />
              </span>
              <span className="notif-body">
                <b>{n.title}</b>
                <span>{n.message}</span>
                <small>{formatDate(n.createdAt)}</small>
              </span>
              {!n.isRead && <span className="unread-dot" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
