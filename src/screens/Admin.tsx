import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Coins,
  Gift,
  Link2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";
import { businessLabel, compact, formatDate, money } from "../utils";
import {
  Avatar,
  Brand,
  Empty,
  Segmented,
  Splash,
  Stat,
} from "../components/ui";

type Tab = "businesses" | "users";

const ROLE_LABEL: Record<string, string> = {
  admin: "Админ",
  business: "Бизнес",
  client: "Клиент",
};

export default function AdminPanel({
  profile,
  onLogout,
  onError,
  onSuccess,
}: {
  profile: Profile;
  onLogout: () => void;
  onError: (e: any) => void;
  onSuccess: (text: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("businesses");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data: result, error } = await supabase.rpc("get_admin_overview");
    if (error) onError(error);
    else setData(result);
    setLoading(false);
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function removeUser(id: string, label: string) {
    if (
      !window.confirm(
        `Удалить аккаунт «${label}» и все его данные? Это действие необратимо.`
      )
    )
      return;
    const { error } = await supabase.rpc("admin_delete_user", {
      p_user_id: id,
    });
    if (error) return onError(error);
    onSuccess("Аккаунт удалён");
    load();
  }

  if (loading) return <Splash text="Загружаем данные платформы…" />;

  const stats = data?.stats || {};
  const businesses: any[] = data?.businesses || [];
  const users: any[] = data?.users || [];
  const q = search.trim().toLowerCase();
  const fb = businesses.filter((b) =>
    `${b.company_name} ${b.owner_name} ${b.email} ${b.phone}`
      .toLowerCase()
      .includes(q)
  );
  const fu = users.filter((u) =>
    `${u.full_name} ${u.email} ${u.phone} ${u.role}`.toLowerCase().includes(q)
  );

  return (
    <div className="admin">
      <header className="admin-top glass">
        <Brand subtitle="Администратор" />
        <div className="row gap">
          <span className="chip-user hide-sm">
            <ShieldCheck size={15} /> {profile.email}
          </span>
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

      <main className="admin-content">
        <section className="hero-card">
          <div className="hero-card-glow" />
          <div>
            <span className="eyebrow">Панель платформы</span>
            <h2>Вся платформа BusinessGrowth</h2>
            <p>
              Компании, клиенты и оборот в реальном времени. Удаление аккаунта
              стирает все его данные.
            </p>
          </div>
        </section>

        <div className="stat-grid five">
          <Stat
            title="Бизнесов"
            value={Number(stats.businesses || 0)}
            icon={<Building2 size={18} />}
            tone="violet"
          />
          <Stat
            title="Клиентов"
            value={Number(stats.clients || 0)}
            icon={<Users size={18} />}
            tone="cyan"
          />
          <Stat
            title="Участий"
            value={Number(stats.memberships || 0)}
            icon={<Link2 size={18} />}
            tone="amber"
          />
          <Stat
            title="Оборот"
            value={Number(stats.turnover || 0)}
            format={compact}
            icon={<Coins size={18} />}
            tone="lime"
          />
          <Stat
            title="Бонусы"
            value={Number(stats.bonuses || 0)}
            format={compact}
            icon={<Gift size={18} />}
            tone="pink"
          />
        </div>

        <div className="card">
          <div className="card-head wrap">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                {
                  value: "businesses",
                  label: `Бизнесы · ${businesses.length}`,
                },
                { value: "users", label: `Аккаунты · ${users.length}` },
              ]}
            />
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск"
              />
            </label>
          </div>

          {tab === "businesses" ? (
            fb.length === 0 ? (
              <Empty
                icon={<Building2 size={22} />}
                title="Бизнесов нет"
                text="Здесь появятся зарегистрированные компании."
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Компания</th>
                      <th>Владелец</th>
                      <th>Клиентов</th>
                      <th>Оборот</th>
                      <th>Кэшбэк</th>
                      <th>С нами</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {fb.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div className="cell-user">
                            <Avatar name={b.company_name} size="sm" />
                            <div className="minw0">
                              <b className="block">{b.company_name}</b>
                              <small className="muted">
                                {businessLabel(b.business_type)}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <b className="block">{b.owner_name}</b>
                          <small className="muted">{b.email}</small>
                        </td>
                        <td>{b.clients_count}</td>
                        <td>{money(Number(b.turnover))}</td>
                        <td>{Number(b.cashback_rate)}%</td>
                        <td className="muted">{formatDate(b.created_at)}</td>
                        <td>
                          <button
                            className="icon-btn danger sm"
                            aria-label="Удалить"
                            onClick={() => removeUser(b.id, b.company_name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : fu.length === 0 ? (
            <Empty icon={<Users size={22} />} title="Никого не нашли" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Роль</th>
                    <th>Почта</th>
                    <th>Программ</th>
                    <th>Последний вход</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {fu.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="cell-user">
                          <Avatar name={u.full_name || u.email} size="sm" />
                          <div className="minw0">
                            <b className="block">{u.full_name || "—"}</b>
                            <small className="muted">{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge role-${u.role}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td>
                        {u.email_confirmed_at ? (
                          <span className="badge badge-active">
                            подтверждена
                          </span>
                        ) : (
                          <span className="badge badge-basic">
                            не подтверждена
                          </span>
                        )}
                      </td>
                      <td>{u.role === "client" ? u.memberships : "—"}</td>
                      <td className="muted">
                        {u.last_sign_in_at
                          ? formatDate(u.last_sign_in_at)
                          : "—"}
                      </td>
                      <td>
                        {u.id !== profile.id && (
                          <button
                            className="icon-btn danger sm"
                            aria-label="Удалить"
                            onClick={() =>
                              removeUser(u.id, u.full_name || u.email)
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
