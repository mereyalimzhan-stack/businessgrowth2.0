import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  Coins,
  Crown,
  Gift,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  Megaphone,
  Phone,
  QrCode,
  ScanLine,
  Sparkles,
  Store,
  Target,
  UserRound,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { BUSINESS_TYPES } from "../types";
import type { AccountType, BusinessType } from "../types";
import { appUrl, businessLabel, errorText } from "../utils";
import { Brand, Input, Segmented, Select, Spinner, TiltCard } from "../components/ui";

type Mode = "login" | "register";
type Step = "form" | "sent" | "forgot" | "reset-sent";

function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, start: (s = 60) => setLeft(s) };
}

export function AuthForm({
  fixedType,
  defaultMode = "login",
  onRecovery,
}: {
  fixedType?: AccountType;
  defaultMode?: Mode;
  onRecovery: (on: boolean) => void;
}) {
  const [accountType, setAccountType] = useState<AccountType>(fixedType || "business");
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("Coffee");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const cooldown = useCooldown();

  const cleanEmail = email.trim().toLowerCase();
  const isBusiness = accountType === "business";

  function reset(next: Step) {
    setError("");
    setInfo("");
    setStep(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (loginError) {
          if (/not confirmed/i.test(loginError.message)) {
            await supabase.auth.resend({ type: "signup", email: cleanEmail, options: { emailRedirectTo: appUrl() } });
            cooldown.start();
            reset("sent");
            setInfo("Почта ещё не подтверждена — мы отправили письмо ещё раз.");
            return;
          }
          throw loginError;
        }
        return;
      }

      if (password.length < 6) throw new Error("Пароль должен быть не короче 6 символов.");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: appUrl(),
          data: {
            account_type: accountType,
            full_name: fullName.trim(),
            phone: phone.trim(),
            company_name: isBusiness ? companyName.trim() : undefined,
            business_type: isBusiness ? businessType : undefined,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error("Этот email уже зарегистрирован. Войдите в аккаунт.");
      }
      if (data.session) return;
      cooldown.start();
      reset("sent");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown.left > 0) return;
    setError("");
    setInfo("");
    const { error: resendError } =
      step === "reset-sent"
        ? await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: appUrl() })
        : await supabase.auth.resend({ type: "signup", email: cleanEmail, options: { emailRedirectTo: appUrl() } });
    if (resendError) setError(errorText(resendError));
    else {
      cooldown.start();
      setInfo("Письмо отправлено ещё раз.");
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: appUrl() });
    setLoading(false);
    if (resetError) return setError(errorText(resetError));
    cooldown.start();
    reset("reset-sent");
  }

  if (step === "sent" || step === "reset-sent") {
    const isReset = step === "reset-sent";
    return (
      <div className="auth-step" key="sent">
        <div className="mail-badge">
          <MailCheck size={26} />
        </div>
        <h1 className="auth-title">{isReset ? "Проверьте почту" : "Завершите верификацию"}</h1>
        <p className="auth-lead">
          Мы отправили ссылку на <b>{cleanEmail}</b>.
        </p>
        <ol style={{ display: "grid", gap: 10, margin: "-8px 0 20px", paddingLeft: 20, fontSize: 14, color: "var(--text-2, var(--muted))" }}>
          <li>Откройте письмо. Если его нет — загляните в «Спам» или «Промоакции».</li>
          {isReset ? (
            <li>Перейдите по ссылке из письма — откроется страница, где можно задать новый пароль.</li>
          ) : (
            <>
              <li>Перейдите по ссылке из письма — ваш email будет подтверждён.</li>
              <li>Если после перехода по ссылке откроется страница с ошибкой, не беспокойтесь: подтверждение уже выполнено. Закройте эту страницу и вернитесь на сайт BusinessGrowth.</li>
              <li>Нажмите «Войти» и введите email и пароль, указанные при регистрации. Повторно регистрироваться не нужно.</li>
            </>
          )}
        </ol>
        {error && <div className="alert alert-error">{error}</div>}
        {info && <div className="alert alert-success">{info}</div>}
        {!isReset && (
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            onClick={() => {
              setMode("login");
              reset("form");
            }}
          >
            Войти <ArrowRight size={18} />
          </button>
        )}
        <div className="auth-links">
          <button type="button" className="link-btn" onClick={resend} disabled={cooldown.left > 0}>
            {cooldown.left > 0 ? `Отправить письмо снова через ${cooldown.left} с` : "Письмо не пришло? Отправить ещё раз"}
          </button>
          <button type="button" className="link-btn muted-link" onClick={() => reset("form")}>
            <ArrowLeft size={15} /> Изменить email
          </button>
        </div>
      </div>
    );
  }

  if (step === "forgot") {
    return (
      <div className="auth-step" key="forgot">
        <div className="mail-badge">
          <KeyRound size={26} />
        </div>
        <h1 className="auth-title">Восстановление пароля</h1>
        <p className="auth-lead">Пришлём ссылку на почту — по ней вы зададите новый пароль.</p>
        <form onSubmit={sendReset}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            icon={<Mail size={17} />}
            autoComplete="email"
            autoFocus
          />
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <Spinner /> : "Получить ссылку"}
          </button>
        </form>
        <div className="auth-links">
          <button type="button" className="link-btn muted-link" onClick={() => reset("form")}>
            <ArrowLeft size={15} /> Назад ко входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-step" key={`form-${mode}-${accountType}`}>
      {!fixedType && (
        <Segmented
          value={accountType}
          onChange={(v) => {
            setAccountType(v);
            setError("");
          }}
          options={[
            {
              value: "business",
              label: (
                <>
                  <Store size={16} /> Бизнес
                </>
              ),
            },
            {
              value: "client",
              label: (
                <>
                  <UserRound size={16} /> Клиент
                </>
              ),
            },
          ]}
        />
      )}

      <h1 className="auth-title">
        {mode === "login"
          ? isBusiness
            ? "С возвращением"
            : "Мои бонусы"
          : isBusiness
          ? "Кабинет бизнеса"
          : "Аккаунт клиента"}
      </h1>
      <p className="auth-lead">
        {mode === "login"
          ? isBusiness
            ? "Клиенты, выручка и акции — в одном месте."
            : "Баланс кэшбэка во всех любимых местах."
          : isBusiness
          ? "Минута на регистрацию. Подтвердите почту по ссылке из письма."
          : "Копите кэшбэк и узнавайте об акциях первыми."}
      </p>

      <form onSubmit={submit}>
        {mode === "register" && (
          <>
            <Input
              label={isBusiness ? "Ваше имя" : "Имя"}
              value={fullName}
              onChange={setFullName}
              placeholder="Айгерим"
              icon={<UserRound size={17} />}
              autoComplete="name"
            />
            {isBusiness && (
              <div className="form-row">
                <Input
                  label="Компания"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Coffee House"
                  icon={<Building2 size={17} />}
                  autoComplete="organization"
                />
                <Select
                  label="Сфера"
                  value={businessType}
                  onChange={setBusinessType}
                  options={BUSINESS_TYPES}
                />
              </div>
            )}
            <Input
              label="Телефон"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+7 777 000 00 00"
              icon={<Phone size={17} />}
              autoComplete="tel"
            />
          </>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          icon={<Mail size={17} />}
          autoComplete="email"
        />
        <Input
          label="Пароль"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
          icon={<Lock size={17} />}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
        {mode === "login" && (
          <button type="button" className="forgot" onClick={() => reset("forgot")}>
            Забыли пароль?
          </button>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? (
            <Spinner />
          ) : (
            <>
              {mode === "login" ? "Войти" : "Создать аккаунт"} <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Зарегистрироваться" : "Войти"}
        </button>
      </p>
    </div>
  );
}

function HeroCard() {
  return (
    <div className="hero-visual">
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
  );
}

export function AuthScreen({
  onRecovery,
  onAbout,
  defaultMode = "login",
}: {
  onRecovery: (on: boolean) => void;
  onAbout?: () => void;
  defaultMode?: Mode;
}) {
  return (
    <div className="auth-page">
      <section className="auth-hero">
        <Brand subtitle="Программа лояльности" />
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> CRM + кэшбэк + аналитика
          </span>
          <h2>
            Клиенты возвращаются.
            <br />
            <span className="gradient-text">Выручка растёт.</span>
          </h2>
          <p>
            QR-код на кассе, кэшбэк с каждой покупки и понятная аналитика. Без карт, приложений и
            сложных настроек.
          </p>
        </div>
        <HeroCard />
        <ul className="hero-features">
          <li>
            <QrCode size={17} /> Регистрация клиента за 20 секунд
          </li>
          <li>
            <Zap size={17} /> Кэшбэк начисляется автоматически
          </li>
          <li>
            <BarChart3 size={17} /> Доходы, расходы и акции
          </li>
        </ul>
      </section>

      <main className="auth-main">
        <div className="auth-card glass">
          <div className="auth-card-brand">
            <Brand subtitle="Программа лояльности" />
          </div>
          <AuthForm onRecovery={onRecovery} defaultMode={defaultMode} />
          {onAbout && (
            <button type="button" className="about-link" onClick={onAbout}>
              <Sparkles size={16} />
              <span className="grow">
                <b>Что такое BusinessGrowth?</b>
                <small>Как работает, тарифы и ответы на вопросы</small>
              </span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export function JoinScreen({
  token,
  onRecovery,
  onCancel,
}: {
  token: string;
  onRecovery: (on: boolean) => void;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState<any>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_company_by_qr", { p_qr_token: token });
      if (!alive) return;
      if (error || !data) setStatus("missing");
      else {
        setCompany(data);
        setStatus("ok");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  if (status === "missing") {
    return (
      <div className="center-page">
        <div className="auth-card glass narrow-card">
          <Brand subtitle="Программа лояльности" />
          <div className="join-missing">
            <QrCode size={34} />
            <h1 className="auth-title">QR-код не найден</h1>
            <p className="auth-lead">Возможно, компания обновила код. Попросите на кассе свежий QR.</p>
            <button className="btn btn-secondary btn-block" onClick={onCancel}>
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page join-page">
      <div className="join-wrap">
        <div className="join-hero">
          <div className="join-logo">{(company?.company_name || "•").charAt(0).toUpperCase()}</div>
          <div className="minw0">
            <span className="eyebrow">
              <Gift size={13} /> Приглашение в программу
            </span>
            <h1 className="join-name">{company?.company_name || "Загружаем…"}</h1>
            {company && <p className="muted">{businessLabel(company.business_type)}</p>}
          </div>
          {company && (
            <div className="join-rate">
              <b>{Number(company.cashback_rate)}%</b>
              <small>кэшбэк</small>
            </div>
          )}
        </div>
        <div className="auth-card glass">
          {status === "loading" ? (
            <div className="center-inline">
              <Spinner size={26} />
            </div>
          ) : (
            <AuthForm fixedType="client" defaultMode="register" onRecovery={onRecovery} />
          )}
        </div>
        <button className="link-btn muted-link" onClick={onCancel}>
          Я владелец бизнеса
        </button>
      </div>
    </div>
  );
}

export function NewPasswordScreen({ onDone }: { onDone: (ok: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("Пароль должен быть не короче 6 символов.");
    if (password !== repeat) return setError("Пароли не совпадают.");
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(errorText(updateError));
    onDone(true);
  }

  return (
    <div className="center-page">
      <div className="auth-card glass narrow-card">
        <Brand subtitle="Безопасность" />
        <div className="auth-step">
          <div className="mail-badge">
            <KeyRound size={26} />
          </div>
          <h1 className="auth-title">Новый пароль</h1>
          <p className="auth-lead">Почта подтверждена. Придумайте новый пароль для входа.</p>
          <form onSubmit={save}>
            <Input label="Новый пароль" type="password" value={password} onChange={setPassword} icon={<Lock size={17} />} autoComplete="new-password" autoFocus />
            <Input label="Повторите пароль" type="password" value={repeat} onChange={setRepeat} icon={<Lock size={17} />} autoComplete="new-password" />
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <Spinner /> : "Сохранить пароль"}
            </button>
          </form>
          <button type="button" className="link-btn muted-link" onClick={() => onDone(false)}>
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
}

const ONBOARDING_STEPS = [
  {
    title: "Кабинет готов",
    desc: "Компания зарегистрирована. Всё, что нужно для программы лояльности, уже включено.",
    icon: <Store size={34} />,
  },
  {
    title: "Настройте кэшбэк",
    desc: "В разделе «Профиль» укажите процент, который вернётся клиентам бонусами.",
    icon: <Gift size={34} />,
  },
  {
    title: "QR-код на кассу",
    desc: "Распечатайте QR-код. Клиент сканирует его камерой, регистрируется и подтверждает почту по ссылке.",
    icon: <QrCode size={34} />,
  },
  {
    title: "Проводите покупки",
    desc: "В разделе «Клиенты» нажмите «Покупка» — бонусы начислятся, а клиент получит уведомление.",
    icon: <Users size={34} />,
  },
];

export function OnboardingWizard({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  return (
    <div className="center-page">
      <div className="auth-card glass onboarding narrow-card">
        <Brand subtitle="Быстрый старт" />
        <div className="dots">
          {ONBOARDING_STEPS.map((_, i) => (
            <span key={i} className={i <= step ? "dot on" : "dot"} />
          ))}
        </div>
        <div className="onboarding-body" key={step}>
          <div className="onboarding-icon">{current.icon}</div>
          <h2>{current.title}</h2>
          <p>{current.desc}</p>
        </div>
        <div className="row gap">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={17} />
            </button>
          )}
          <button className="btn btn-primary grow" onClick={() => (isLast ? onFinish() : setStep(step + 1))}>
            {isLast ? "Начать работу" : "Дальше"} <ArrowRight size={17} />
          </button>
        </div>
        <button className="link-btn muted-link" onClick={onFinish}>
          Пропустить
        </button>
      </div>
    </div>
  );
}
