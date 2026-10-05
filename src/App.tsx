import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type {
  BusinessNotification,
  BusinessUser,
  Campaign,
  Client,
  NewCampaign,
  NewTransaction,
  Page,
  Profile,
  Transaction,
} from "./types";
import {
  clearUrl,
  errorText,
  mapBusiness,
  mapBusinessNotification,
  mapCampaign,
  mapClient,
  mapProfile,
  mapTransaction,
  readJoinToken,
  storage,
} from "./utils";
import {
  AuthScreen,
  JoinScreen,
  NewPasswordScreen,
  OnboardingWizard,
} from "./screens/Auth";
import ClientPortal from "./screens/ClientPortal";
import AdminPanel from "./screens/Admin";
import Dashboard from "./screens/Dashboard";
import type { DashboardActions } from "./screens/Dashboard";
import { Aurora, Brand, Splash, TiltCard, Toast } from "./components/ui";
import type { Notice } from "./components/ui";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  Coins,
  Crown,
  Gift,
  Megaphone,
  QrCode,
  ScanLine,
  Sparkles,
  Store,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const PENDING_JOIN_KEY = "bg_pending_join";
const onboardedKey = (id: string) => `bg_onboarded_${id}`;

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [business, setBusiness] = useState<BusinessUser | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [notifications, setNotifications] = useState<BusinessNotification[]>(
    []
  );
  const [page, setPage] = useState<Page>("dashboard");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [authMode, setAuthMode] = useState<"about" | "login" | "register">(
    "login"
  );
  const [onboarding, setOnboarding] = useState(false);
  const [portalVersion, setPortalVersion] = useState(0);
  const loadedFor = useRef<string | null>(null);

  const fail = useCallback(
    (err: any) => setNotice({ kind: "error", text: errorText(err) }),
    []
  );
  const ok = useCallback(
    (text: string) => setNotice({ kind: "success", text }),
    []
  );

  const resetData = useCallback(() => {
    loadedFor.current = null;
    setProfile(null);
    setBusiness(null);
    setClients([]);
    setTransactions([]);
    setCampaigns([]);
    setNotifications([]);
    setPage("dashboard");
  }, []);

  const loadCompanyData = useCallback(async (companyId: string) => {
    const [c, t, k, n] = await Promise.all([
      supabase
        .from("clients")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("campaigns")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("business_notifications")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ]);
    const firstError = c.error || t.error || k.error || n.error;
    if (firstError) setNotice({ kind: "error", text: errorText(firstError) });
    if (!c.error) setClients((c.data || []).map(mapClient));
    if (!t.error) setTransactions((t.data || []).map(mapTransaction));
    if (!k.error) setCampaigns((k.data || []).map(mapCampaign));
    if (!n.error) setNotifications((n.data || []).map(mapBusinessNotification));
  }, []);

  const loadAccount = useCallback(
    async (s: Session | null, force = false) => {
      if (!s?.user) {
        resetData();
        return;
      }
      if (!force && loadedFor.current === s.user.id) return;
      loadedFor.current = s.user.id;
      setProfileLoading(true);
      setProfileError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", s.user.id)
        .maybeSingle();
      if (error || !data) {
        setProfileError(
          error
            ? errorText(error)
            : "Профиль не найден. Проверьте, что SQL-скрипт выполнен в Supabase."
        );
        setProfileLoading(false);
        return;
      }
      const p = mapProfile(data);
      setProfile(p);

      if (p.role === "business") {
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("*")
          .eq("id", p.id)
          .maybeSingle();
        if (companyError)
          setNotice({ kind: "error", text: errorText(companyError) });
        setBusiness(mapBusiness(p, company));
        await loadCompanyData(p.id);
        if (!storage.get(onboardedKey(p.id))) setOnboarding(true);
      }

      const pending = storage.get(PENDING_JOIN_KEY);
      if (pending) {
        if (p.role === "client") {
          const { data: joined, error: joinError } = await supabase.rpc(
            "join_company",
            { p_qr_token: pending }
          );
          if (joinError)
            setNotice({ kind: "error", text: errorText(joinError) });
          else if (joined?.already)
            setNotice({
              kind: "success",
              text: `Вы уже участник «${joined.company_name}»`,
            });
          else if (joined)
            setNotice({
              kind: "success",
              text: `Готово! Вы в программе «${joined.company_name}»`,
            });
          setPortalVersion((v) => v + 1);
        } else {
          setNotice({
            kind: "error",
            text: "Вы вошли как бизнес. Чтобы вступить в программу, войдите аккаунтом клиента.",
          });
        }
        storage.remove(PENDING_JOIN_KEY);
        setJoinToken(null);
      }

      setProfileLoading(false);
    },
    [loadCompanyData, resetData]
  );

  useEffect(() => {
    let alive = true;
    const token = readJoinToken();
    if (token) {
      storage.set(PENDING_JOIN_KEY, token);
      clearUrl();
    }
    setJoinToken(token || storage.get(PENDING_JOIN_KEY));

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadAccount(data.session);
      if (alive) setBooting(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!alive || event === "INITIAL_SESSION") return;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
      setSession(next);
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        setTimeout(() => loadAccount(next), 0);
      }
      if (window.location.hash.includes("access_token")) clearUrl();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadAccount]);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setRecovery(false);
    setAuthMode("login");
    resetData();
  }

  async function updateBusiness(updated: BusinessUser) {
    if (!business) return;
    const [p, c] = await Promise.all([
      supabase
        .from("profiles")
        .update({ full_name: updated.ownerName, phone: updated.phone })
        .eq("id", business.id),
      supabase
        .from("companies")
        .update({
          company_name: updated.companyName,
          business_type: updated.businessType,
          cashback_rate: updated.cashbackRate,
        })
        .eq("id", business.id),
    ]);
    if (p.error || c.error) return fail(p.error || c.error);
    setBusiness(updated);
    ok("Профиль сохранён");
  }

  async function regenerateQr() {
    if (!business) return;
    const { data, error } = await supabase.rpc("regenerate_qr_token");
    if (error) return fail(error);
    setBusiness({ ...business, qrToken: String(data) });
    ok("Создан новый QR-код. Старый больше не работает.");
  }

  async function addTransaction(d: NewTransaction) {
    if (!business) return;
    const { data, error } = await supabase
      .from("transactions")
      .insert({ company_id: business.id, ...d })
      .select()
      .single();
    if (error) return fail(error);
    setTransactions((prev) => [mapTransaction(data), ...prev]);
    ok(d.type === "income" ? "Доход добавлен" : "Расход добавлен");
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return fail(error);
    setTransactions((prev) => prev.filter((x) => x.id !== id));
  }

  async function addCampaign(d: NewCampaign) {
    if (!business) return;
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        company_id: business.id,
        name: d.name,
        description: d.description,
        start_date: d.startDate,
        end_date: d.endDate,
        budget: d.budget,
        expected_revenue: d.expectedRevenue,
        status: d.status,
      })
      .select()
      .single();
    if (error) return fail(error);
    setCampaigns((prev) => [mapCampaign(data), ...prev]);
    const reach = clients.filter((c) => c.userId).length;
    ok(
      reach > 0
        ? `Акция запущена — уведомили клиентов: ${reach}`
        : "Акция запущена"
    );
  }

  async function toggleCampaign(c: Campaign) {
    const status = c.status === "Активна" ? "Завершена" : "Активна";
    const { error } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", c.id);
    if (error) return fail(error);
    setCampaigns((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status } : x))
    );
  }

  async function deleteCampaign(id: string) {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return fail(error);
    setCampaigns((prev) => prev.filter((x) => x.id !== id));
  }

  async function addClient(d: { name: string; phone: string; email: string }) {
    if (!business) return;
    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_id: business.id,
        name: d.name.trim(),
        phone: d.phone.trim(),
        email: d.email.trim() || null,
      })
      .select()
      .single();
    if (error) return fail(error);
    setClients((prev) => [mapClient(data), ...prev]);
    ok("Клиент добавлен");
  }

  async function deleteClient(id: string) {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return fail(error);
    setClients((prev) => prev.filter((x) => x.id !== id));
  }

  async function addPurchase(client: Client, amount: number) {
    const { data, error } = await supabase.rpc("record_purchase", {
      p_client_id: client.id,
      p_amount: amount,
    });
    if (error) return fail(error);
    if (data?.client)
      setClients((prev) =>
        prev.map((x) => (x.id === client.id ? mapClient(data.client) : x))
      );
    if (data?.transaction)
      setTransactions((prev) => [mapTransaction(data.transaction), ...prev]);
    ok(
      `Покупка проведена. Начислено ${Number(data?.bonus || 0).toLocaleString(
        "ru-RU"
      )} ₸ бонусов`
    );
  }

  async function redeemBonuses(client: Client, amount: number) {
    const { data, error } = await supabase.rpc("redeem_bonuses", {
      p_client_id: client.id,
      p_amount: amount,
    });
    if (error) return fail(error);
    if (data)
      setClients((prev) =>
        prev.map((x) => (x.id === client.id ? mapClient(data) : x))
      );
    ok("Бонусы списаны");
  }

  async function markNotificationRead(id: string) {
    const { error } = await supabase
      .from("business_notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) return fail(error);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function markAllRead() {
    if (!business) return;
    const { error } = await supabase
      .from("business_notifications")
      .update({ is_read: true })
      .eq("company_id", business.id)
      .eq("is_read", false);
    if (error) return fail(error);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function refresh() {
    if (business) await loadCompanyData(business.id);
  }

  const actions: DashboardActions = {
    logout,
    updateBusiness,
    regenerateQr,
    addClient,
    deleteClient,
    addPurchase,
    redeemBonuses,
    addTransaction,
    deleteTransaction,
    addCampaign,
    toggleCampaign,
    deleteCampaign,
    markNotificationRead,
    markAllRead,
    refresh,
    startOnboarding: () => setOnboarding(true),
  };

  function finishOnboarding() {
    if (profile) storage.set(onboardedKey(profile.id), "1");
    setOnboarding(false);
  }

  function cancelJoin() {
    storage.remove(PENDING_JOIN_KEY);
    setJoinToken(null);
  }

  function renderScreen() {
    if (booting) return <Splash />;

    if (recovery && session) {
      return (
        <NewPasswordScreen
          onDone={(changed) => {
            setRecovery(false);
            if (changed) ok("Пароль обновлён");
            loadAccount(session, true);
          }}
        />
      );
    }

    if (!session) {
      if (joinToken)
        return (
          <JoinScreen
            token={joinToken}
            onRecovery={setRecovery}
            onCancel={cancelJoin}
          />
        );
      if (authMode === "about") {
        return (
          <Landing
            onLogin={() => {
              setAuthMode("login");
              window.scrollTo({ top: 0 });
            }}
            onRegister={() => {
              setAuthMode("register");
              window.scrollTo({ top: 0 });
            }}
          />
        );
      }
      return (
        <AuthScreen
          key={authMode}
          defaultMode={authMode}
          onRecovery={setRecovery}
          onAbout={() => {
            setAuthMode("about");
            window.scrollTo({ top: 0 });
          }}
        />
      );
    }

    if (profileError) {
      return (
        <div className="center-page">
          <div className="auth-card glass narrow-card">
            <Brand subtitle="Ошибка" />
            <div className="alert alert-error mt">{profileError}</div>
            <div className="row gap">
              <button className="btn btn-secondary grow" onClick={logout}>
                Выйти
              </button>
              <button
                className="btn btn-primary grow"
                onClick={() => loadAccount(session, true)}
              >
                Повторить
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (profileLoading || !profile) return <Splash text="Загружаем кабинет…" />;

    if (profile.role === "admin")
      return (
        <AdminPanel
          profile={profile}
          onLogout={logout}
          onError={fail}
          onSuccess={ok}
        />
      );

    if (profile.role === "client") {
      return (
        <ClientPortal
          key={portalVersion}
          profile={profile}
          onLogout={logout}
          onError={fail}
        />
      );
    }

    if (!business) return <Splash text="Загружаем кабинет…" />;
    if (onboarding) return <OnboardingWizard onFinish={finishOnboarding} />;

    return (
      <Dashboard
        user={business}
        page={page}
        setPage={setPage}
        clients={clients}
        transactions={transactions}
        campaigns={campaigns}
        notifications={notifications}
        actions={actions}
      />
    );
  }

  return (
    <>
      <Aurora />
      <Toast notice={notice} onClose={() => setNotice(null)} />
      {renderScreen()}
    </>
  );
}

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="l-section" id={id}>
      <div className="l-head">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {lead && <p>{lead}</p>}
      </div>
      {children}
    </section>
  );
}

const PLANS: {
  name: string;
  price: number;
  note: string;
  hot?: boolean;
  features: string[];
}[] = [
  {
    name: "Старт",
    price: 0,
    note: "навсегда",
    features: [
      "до 50 клиентов",
      "QR-код и постер",
      "кэшбэк и списание бонусов",
      "учёт доходов и расходов",
    ],
  },
  {
    name: "Бизнес",
    price: 7990,
    note: "в месяц",
    hot: true,
    features: [
      "безлимит клиентов",
      "акции с уведомлениями клиентам",
      "аналитика и рекомендации",
      "экспорт клиентов в Excel",
      "поддержка в WhatsApp",
    ],
  },
  {
    name: "Сеть",
    price: 19990,
    note: "в месяц",
    features: [
      "до 5 точек",
      "всё из тарифа «Бизнес»",
      "общая база клиентов сети",
      "персональный менеджер",
    ],
  },
];

const FAQ = [
  {
    q: "Клиенту нужно скачивать приложение?",
    a: "Нет. Клиент сканирует QR-код камерой телефона и регистрируется в браузере. Свои бонусы он видит на сайте в любое время.",
  },
  {
    q: "Нужно ли оборудование или касса?",
    a: "Нет. Достаточно распечатать постер с QR-кодом. Покупки проводятся в кабинете с телефона или компьютера.",
  },
  {
    q: "Как клиент тратит бонусы?",
    a: "Клиент называет на кассе свой код или имя, а вы нажимаете «Списать» и вводите сумму. Бонусы работают только в вашем заведении.",
  },
  {
    q: "Сколько стоит?",
    a: "Тариф «Старт» бесплатный навсегда. Платные тарифы нужны, когда клиентов становится больше 50 или хочется запускать акции.",
  },
  {
    q: "Можно ли накрутить бонусы?",
    a: "Нет. Бонусы считает сервер по проценту кэшбэка, который вы задали. Каждая покупка записывается в финансы.",
  },
];

function Landing({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="landing">
      <header className="l-nav glass">
        <Brand subtitle="Программа лояльности" />
        <nav className="l-links">
          <a href="#product">Как работает</a>
          <a href="#why">Преимущества</a>
          <a href="#pricing">Тарифы</a>
          <a href="#faq">Вопросы</a>
        </nav>
        <div className="row gap">
          <button className="btn btn-secondary btn-sm" onClick={onLogin}>
            Войти
          </button>
          <button
            className="btn btn-primary btn-sm hide-sm"
            onClick={onRegister}
          >
            Попробовать
          </button>
        </div>
      </header>

      <section className="l-hero">
        <div className="l-hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> Для кофеен, салонов, магазинов и фитнеса
          </span>
          <h1>
            Кэшбэк-программа для малого бизнеса
            <br />
            <span className="gradient-text">за 5 минут, без приложений</span>
          </h1>
          <p>
            Клиент сканирует QR-код на кассе, регистрируется за 20 секунд и
            копит бонусы. Бизнес видит, кто возвращается, запускает акции и
            считает прибыль — в одном кабинете.
          </p>
          <div className="row gap wrap">
            <button className="btn btn-primary btn-lg" onClick={onRegister}>
              Начать бесплатно <ArrowRight size={18} />
            </button>
            <a className="btn btn-secondary btn-lg" href="#product">
              Как это работает
            </a>
          </div>
          <div className="l-proof">
            <span>
              <Check size={15} /> Тариф «Старт» бесплатно
            </span>
            <span>
              <Check size={15} /> Без оборудования
            </span>
            <span>
              <Check size={15} /> Запуск за 5 минут
            </span>
          </div>
        </div>
        <div className="l-hero-visual">
          <TiltCard className="hero-tilt">
            <div className="lcard">
              <div className="lcard-shine" />
              <div className="lcard-top">
                <span className="lcard-company">Coffee House</span>
                <span className="lcard-vip">★ VIP</span>
              </div>
              <div className="lcard-chip" />
              <div className="lcard-bottom">
                <div>
                  <small>Бонусный баланс</small>
                  <b>12 480 ₸</b>
                </div>
                <span className="lcard-rate">5%</span>
              </div>
            </div>
          </TiltCard>
          <div className="float-pill pill-a">
            <span className="pill-icon lime">
              <Gift size={15} />
            </span>
            <span>
              <b>+250 ₸</b> кэшбэк начислен
            </span>
          </div>
          <div className="float-pill pill-b">
            <span className="pill-icon violet">
              <QrCode size={15} />
            </span>
            <span>
              <b>Новый клиент</b> по QR-коду
            </span>
          </div>
        </div>
      </section>

      <Section
        id="product"
        eyebrow="Как это работает"
        title="Как работает BusinessGrowth"
        lead="Три шага — и у бизнеса своя программа лояльности, а у клиента бонусы в телефоне без установки приложений."
      >
        <div className="l-steps">
          {[
            {
              icon: <QrCode size={22} />,
              title: "QR на кассе",
              text: "Бизнес скачивает готовый постер с QR-кодом и ставит у кассы.",
            },
            {
              icon: <ScanLine size={22} />,
              title: "Клиент сканирует",
              text: "Камера телефона → регистрация с подтверждением почты → клиент в программе.",
            },
            {
              icon: <Coins size={22} />,
              title: "Покупки = бонусы",
              text: "Кассир жмёт «Покупка», кэшбэк начисляется сам, клиент получает уведомление.",
            },
          ].map((s, i) => (
            <div key={s.title} className="l-step">
              <span className="l-step-n">{i + 1}</span>
              <span className="l-icon violet">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
        <div className="l-grid three mt-lg">
          {[
            {
              icon: <Users size={20} />,
              title: "CRM клиентов",
              text: "Поиск по имени, телефону и коду. Статусы: новые, активные, VIP.",
            },
            {
              icon: <Megaphone size={20} />,
              title: "Акции",
              text: "Запускаете акцию — все участники программы получают уведомление.",
            },
            {
              icon: <BarChart3 size={20} />,
              title: "Аналитика",
              text: "Средний чек, доля вернувшихся, спящие клиенты и подсказки, что делать.",
            },
            {
              icon: <Wallet size={20} />,
              title: "Финансы",
              text: "Доходы и расходы, прибыль и маржа — без отдельной таблицы.",
            },
            {
              icon: <Bell size={20} />,
              title: "Кабинет клиента",
              text: "Клиент видит баланс во всех заведениях, акции и историю начислений.",
            },
            {
              icon: <Crown size={20} />,
              title: "Защита от накрутки",
              text: "Бонусы считает сервер, а не касса — начислить лишнее нельзя.",
            },
          ].map((f) => (
            <div key={f.title} className="l-card compact">
              <span className="l-icon cyan">{f.icon}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="why"
        eyebrow="Почему мы"
        title="Просто для бизнеса и клиентов"
      >
        <div className="l-grid three">
          {[
            {
              icon: <Zap size={20} />,
              title: "Без приложений",
              text: "Клиенту не нужно ничего скачивать — регистрация прямо в браузере по QR.",
            },
            {
              icon: <Store size={20} />,
              title: "Для одной точки",
              text: "Запуск за 5 минут без интеграций и оборудования. Бесплатный старт.",
            },
            {
              icon: <Target size={20} />,
              title: "Лояльность + финансы",
              text: "Вы видите не только клиентов, но и сколько на самом деле зарабатываете.",
            },
          ].map((a) => (
            <div key={a.title} className="l-card">
              <span className="l-icon lime">{a.icon}</span>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="pricing"
        eyebrow="Тарифы"
        title="Начните бесплатно"
        lead="Платите, только когда бизнес растёт. Для ваших клиентов сервис всегда бесплатный."
      >
        <div className="l-plans">
          {PLANS.map((p) => (
            <div key={p.name} className={p.hot ? "l-plan hot" : "l-plan"}>
              {p.hot && <span className="l-plan-tag">Популярный</span>}
              <h3>{p.name}</h3>
              <div className="l-price">
                {p.price === 0 ? "0 ₸" : `${fmt(p.price)} ₸`}
                <small> {p.note}</small>
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>
                    <Check size={16} /> {f}
                  </li>
                ))}
              </ul>
              <button
                className={
                  p.hot
                    ? "btn btn-primary btn-block"
                    : "btn btn-secondary btn-block"
                }
                onClick={onRegister}
              >
                {p.price === 0 ? "Начать бесплатно" : "Попробовать 30 дней"}
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section id="faq" eyebrow="Вопросы" title="Частые вопросы">
        <div className="l-faq">
          {FAQ.map((f) => (
            <details key={f.q} className="l-q">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="l-cta">
        <div className="hero-card">
          <div className="hero-card-glow" />
          <div>
            <span className="eyebrow">Тариф «Старт» — бесплатно</span>
            <h2>Запустите программу лояльности сегодня</h2>
            <p>5 минут на регистрацию, QR-постер сразу готов к печати.</p>
          </div>
          <button className="btn btn-lime btn-lg" onClick={onRegister}>
            Начать бесплатно <ArrowRight size={18} />
          </button>
        </div>
        <footer className="l-footer">
          <Brand subtitle="© BusinessGrowth, 2026" />
          <span className="muted">
            Программа лояльности для малого бизнеса Казахстана
          </span>
        </footer>
      </section>
    </div>
  );
}
