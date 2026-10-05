import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Coins, Eye, EyeOff, X } from "lucide-react";
import type { ClientStatus } from "../types";
import { hue, initials } from "../utils";

export function Brand({ subtitle, compact }: { subtitle?: string; compact?: boolean }) {
  return (
    <div className={compact ? "brand compact" : "brand"}>
      <div className="brand-mark">
        <Coins size={compact ? 17 : 20} strokeWidth={2.4} />
      </div>
      {!compact && (
        <div className="minw0">
          <div className="brand-title">
            Business<span>Growth</span>
          </div>
          {subtitle && <div className="brand-sub">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}

export function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
      <span className="grid-overlay" />
    </div>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

export function Splash({ text }: { text?: string }) {
  return (
    <div className="center-page">
      <div className="splash">
        <div className="splash-mark">
          <Coins size={30} strokeWidth={2.3} />
        </div>
        <div className="splash-bar">
          <span />
        </div>
        {text && <p className="muted">{text}</p>}
      </div>
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  min,
  max,
  step,
  hint,
  icon,
  autoComplete,
  autoFocus,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  hint?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className={icon ? "input-wrap has-icon" : "input-wrap"}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className="input"
          type={isPassword && show ? "text" : type}
          required={required}
          value={value}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={type === "number" ? "decimal" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="input-eye"
            onClick={() => setShow(!show)}
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea
        className="input textarea"
        value={value}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap select-wrap">
        <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="segmented" role="tablist" style={{ ["--n" as any]: options.length, ["--i" as any]: index }}>
      <span className="segmented-thumb" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? "segmented-item active" : "segmented-item"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-grip" />
        <div className="modal-head">
          <div className="minw0">
            <h3>{title}</h3>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const v = from + (target - from) * eased;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}

export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const v = useCountUp(value);
  const rounded = Math.round(v);
  return <>{format ? format(rounded) : rounded.toLocaleString("ru-RU")}</>;
}

export function Stat({
  title,
  value,
  format,
  icon,
  tone = "violet",
  hint,
}: {
  title: string;
  value: number;
  format?: (n: number) => string;
  icon: React.ReactNode;
  tone?: "violet" | "cyan" | "lime" | "pink" | "amber" | "red";
  hint?: React.ReactNode;
}) {
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-glow" />
      <div className="stat-top">
        <span className="stat-label">{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">
        <CountUp value={value} format={format} />
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <b>{title}</b>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const cls = status === "VIP" ? "badge badge-vip" : status === "Активный" ? "badge badge-active" : "badge badge-basic";
  return <span className={cls}>{status === "VIP" ? "★ VIP" : status}</span>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const h = hue(name || "x");
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{
        background: `linear-gradient(135deg, hsl(${h} 85% 62%), hsl(${(h + 50) % 360} 85% 52%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export interface Notice {
  kind: "error" | "success";
  text: string;
}

export function Toast({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => closeRef.current(), notice.kind === "success" ? 3200 : 6500);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice) return null;
  return (
    <div className={`toast toast-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
      <span className="toast-icon">
        {notice.kind === "error" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
      </span>
      <span className="grow">{notice.text}</span>
      <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Закрыть">
        <X size={15} />
      </button>
    </div>
  );
}

export function TiltCard({ className, children }: { className?: string; children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const st = useRef({ ry: 0, rx: 0, vy: 0, base: 0, dragging: false, moved: 0, lastX: 0, lastY: 0, hoverX: 0, hoverY: 0, hover: false });

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const s = st.current;
      const t = (now - start) / 1000;
      if (!s.dragging) {
        if (Math.abs(s.vy) > 0.15) {
          s.ry += s.vy;
          s.vy *= 0.94;
          s.base = Math.round(s.ry / 180) * 180;
        } else {
          s.vy = 0;
          const swayY = reduce ? 0 : s.hover ? s.hoverX * 16 : Math.sin(t * 0.7) * 14;
          const swayX = reduce ? 0 : s.hover ? -s.hoverY * 10 : Math.sin(t * 0.9 + 1) * 5;
          s.ry += (s.base + swayY - s.ry) * 0.08;
          s.rx += (swayX - s.rx) * 0.08;
        }
      }
      const el = inner.current;
      if (el) {
        el.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
        const shine = 50 + Math.sin((s.ry * Math.PI) / 180) * 40;
        wrap.current?.style.setProperty("--mx", `${shine.toFixed(1)}%`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function down(e: React.PointerEvent<HTMLDivElement>) {
    const s = st.current;
    s.dragging = true;
    s.moved = 0;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.vy = 0;
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const s = st.current;
    const r = wrap.current?.getBoundingClientRect();
    if (r) {
      s.hoverX = (e.clientX - r.left) / r.width - 0.5;
      s.hoverY = (e.clientY - r.top) / r.height - 0.5;
    }
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.moved += Math.abs(dx) + Math.abs(dy);
    s.ry += dx * 0.6;
    s.rx = Math.max(-25, Math.min(25, s.rx - dy * 0.3));
    s.vy = dx * 0.6;
  }

  function up() {
    const s = st.current;
    if (!s.dragging) return;
    s.dragging = false;
    if (s.moved < 6) {
      s.base = Math.round(s.ry / 180) * 180 + 180;
      s.vy = 0;
    } else if (Math.abs(s.vy) <= 0.15) {
      s.base = Math.round(s.ry / 180) * 180;
    }
  }

  return (
    <div
      ref={wrap}
      className={`tilt ${className || ""}`}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") st.current.hover = true;
      }}
      onPointerLeave={() => {
        st.current.hover = false;
        up();
      }}
    >
      <div ref={inner} className="tilt-inner" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {children}
        <div className="lcard-back" aria-hidden="true">
          <div className="lcard-stripe" />
          <div className="lcard-back-body">
            <div>
              <small>Карта лояльности</small>
              <b>BusinessGrowth</b>
            </div>
            <span className="lcard-coin">
              <Coins size={24} strokeWidth={2.3} />
            </span>
          </div>
        </div>
      </div>
      <p className="tilt-hint">Нажмите или потяните, чтобы повернуть</p>
    </div>
  );
}
