import React, { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Coins,
  Gift,
  LogOut,
  Megaphone,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Store,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";
import {
  businessLabel,
  clientCode,
  daysLeft,
  formatDate,
  hue,
  money,
  plural,
} from "../utils";
import {
  Avatar,
  Brand,
  CountUp,
  Empty,
  Modal,
  Splash,
  TiltCard,
} from "../components/ui";

export default function ClientPortal({
  profile,
  onLogout,
  onError,
}: {
  profile: Profile;
  onLogout: () => void;
  onError: (e: any) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCard, setShowCard] = useState<any>(null);

  const load = useCallback(async () => {
    const { data: result, error } = await supabase.rpc("get_client_portal");
    if (error) onError(error);
    else setData(result);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function markRead(id: string) {
    setData((d: any) => ({
      ...d,
      notifications: d.notifications.map((n: any) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAll() {
    const ids = (data?.notifications || [])
      .filter((n: any) => !n.is_read)
      .map((n: any) => n.id);
    if (!ids.length) return;
    setData((d: any) => ({
      ...d,
      notifications: d.notifications.map((n: any) => ({ ...n, is_read: true })),
    }));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);
  }

  if (loading) return <Splash text="Загружаем ваши бонусы…" />;

  const memberships: any[] = data?.memberships || [];
  const notifications: any[] = data?.notifications || [];
  const campaigns: any[] = data?.campaigns || [];
  const unread = notifications.filter((n) => !n.is_read).length;
  const total = memberships.reduce(
    (s, m) => s + Number(m.bonuses_balance || 0),
    0
  );
  const name = data?.profile?.full_name || profile.fullName;

  return (
    <div className="portal">
      <header className="portal-top">
        <Brand subtitle="Мои бонусы" />
        <div className="row gap">
          <button
            className="icon-btn ghost"
            onClick={refresh}
            aria-label="Обновить"
          >
            <RefreshCw size={18} className={refreshing ? "spin" : ""} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onLogout}>
            <LogOut size={15} /> <span className="hide-sm">Выйти</span>
          </button>
        </div>
      </header>

      <section className="portal-hero">
        <TiltCard className="portal-tilt">
          <div className="lcard big">
            <div className="lcard-shine" />
            <div className="lcard-top">
              <span className="lcard-company">
                <Coins size={18} /> BusinessGrowth
              </span>
              <span className="lcard-vip">
                {memberships.length}{" "}
                {plural(
                  memberships.length,
                  "программа",
                  "программы",
                  "программ"
                )}
              </span>
            </div>
            <div className="lcard-chip" />
            <div className="lcard-bottom">
              <div className="minw0">
                <small>Бонусов на всех картах</small>
                <b>
                  <CountUp value={total} format={money} />
                </b>
                <span className="lcard-name ellipsis">{name}</span>
              </div>
              <span className="lcard-rate">
                <Bell size={16} /> {unread}
              </span>
            </div>
          </div>
        </TiltCard>
        <div className="portal-greet">
          <span className="eyebrow">Здравствуйте, {name.split(" ")[0]}</span>
          <h1>
            Ваш кэшбэк <span className="gradient-text">копится сам</span>
          </h1>
          <p className="muted">
            Называйте на кассе код клиента или имя — бонусы начислятся
            автоматически, а мы пришлём уведомление.
          </p>
          <div className="scan-hint">
            <QrCode size={18} /> Чтобы вступить в новую программу, отсканируйте
            QR-код на кассе.
          </div>
        </div>
      </section>

      {showCard && (
        <Modal
          title={showCard.company_name}
          subtitle="Покажите этот экран кассиру"
          onClose={() => setShowCard(null)}
        >
          <div className="cash-card">
            <div className="qr-frame small">
              <QRCodeSVG
                value={clientCode(showCard.id)}
                size={180}
                level="M"
                fgColor="#0b0d1f"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <div className="cash-code">#{clientCode(showCard.id)}</div>
            <p className="muted">
              {name} · бонусов{" "}
              <b className="lime-text">{money(showCard.bonuses_balance)}</b>
            </p>
          </div>
        </Modal>
      )}

      <div className="portal-grid">
        <section>
          <div className="section-head">
            <h2>Мои программы</h2>
            <span className="count">{memberships.length}</span>
          </div>
          {memberships.length === 0 ? (
            <div className="card">
              <Empty
                icon={<Store size={22} />}
                title="Пока нет программ"
                text="Отсканируйте QR-код в любимой кофейне, салоне или магазине."
              />
            </div>
          ) : (
            <div className="stack">
              {memberships.map((m, i) => {
                const h = hue(m.company_name || "x");
                return (
                  <article
                    key={m.id}
                    className="membership"
                    style={{ ["--h" as any]: h, animationDelay: `${i * 50}ms` }}
                  >
                    <div className="membership-top">
                      <span className="company-logo">
                        {(m.company_name || "•").charAt(0).toUpperCase()}
                      </span>
                      <div className="grow minw0">
                        <h3 className="ellipsis">{m.company_name}</h3>
                        <span className="muted">
                          {businessLabel(m.business_type)}
                        </span>
                      </div>
                      <span className="badge badge-active">
                        {Number(m.cashback_rate)}% кэшбэк
                      </span>
                    </div>
                    <div className="membership-balance">
                      <small>Бонусы</small>
                      <b>{money(m.bonuses_balance)}</b>
                    </div>
                    <div className="mini-stats">
                      <div>
                        <b>{m.purchases_count}</b>
                        <small>покупок</small>
                      </div>
                      <div>
                        <b>{money(m.total_spent)}</b>
                        <small>потрачено</small>
                      </div>
                      <div>
                        <b className="code-text">#{clientCode(m.id)}</b>
                        <small>код на кассе</small>
                      </div>
                    </div>
                    <div className="row between wrap">
                      {m.last_purchase_date ? (
                        <p className="muted small row gap-xs">
                          <ShoppingBag size={13} /> Последняя покупка{" "}
                          {formatDate(m.last_purchase_date)}
                        </p>
                      ) : (
                        <span />
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowCard(m)}
                      >
                        <QrCode size={15} /> Показать на кассе
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {campaigns.length > 0 && (
            <>
              <div className="section-head mt-lg">
                <h2>Акции для вас</h2>
                <span className="count">{campaigns.length}</span>
              </div>
              <div className="stack">
                {campaigns.map((c) => {
                  const left = daysLeft(c.end_date);
                  return (
                    <div key={c.id} className="promo">
                      <span className="promo-icon">
                        <Megaphone size={18} />
                      </span>
                      <div className="grow minw0">
                        <small className="muted">{c.company_name}</small>
                        <b className="block">{c.name}</b>
                        {c.description && <p>{c.description}</p>}
                      </div>
                      <span className="promo-left">
                        <CalendarDays size={13} />{" "}
                        {left > 0
                          ? `${left} ${plural(left, "день", "дня", "дней")}`
                          : "сегодня"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="section-head">
            <h2>Уведомления</h2>
            {unread > 0 ? (
              <button className="link-inline" onClick={markAll}>
                <CheckCheck size={15} /> Прочитать все
              </button>
            ) : (
              <span className="count">0</span>
            )}
          </div>
          <div className="stack">
            {notifications.length === 0 ? (
              <div className="card">
                <Empty
                  icon={<Gift size={22} />}
                  title="Пока тихо"
                  text="Здесь появятся начисления бонусов и акции."
                />
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  className={n.is_read ? "notif read" : "notif"}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <span className="notif-icon">
                    <Bell size={16} />
                  </span>
                  <span className="notif-body">
                    <b>{n.title}</b>
                    <span>{n.message}</span>
                    <small>
                      {n.company_name} · {formatDate(n.created_at)}
                    </small>
                  </span>
                  {!n.is_read && <span className="unread-dot" />}
                </button>
              ))
            )}
          </div>
          <div className="card profile-mini">
            <Avatar name={name} />
            <div className="minw0">
              <b className="block ellipsis">{name}</b>
              <span className="muted ellipsis block">{profile.email}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
