import React, { useState } from "react";
import { CalendarDays, Megaphone, Pause, Play, Plus, Send, Trash2 } from "lucide-react";
import type { Campaign, NewCampaign } from "../types";
import { daysLeft, dateNow, formatDate, money, plural } from "../utils";
import { Empty, Input, Modal, Spinner, Textarea } from "../components/ui";

function progress(c: Campaign) {
  const start = new Date(c.startDate + "T00:00:00").getTime();
  const end = new Date(c.endDate + "T23:59:59").getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

function addDays(n: number) {
  const d = new Date(dateNow() + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TEMPLATES = [
  { name: "−20% по будням", description: "Скидка 20% с понедельника по четверг до 12:00." },
  { name: "Двойной кэшбэк", description: "Все выходные — двойные бонусы за каждую покупку." },
  { name: "Приведи друга", description: "Приходите с другом и получите подарок." },
];

export default function CampaignsView({
  campaigns,
  reach,
  onAddCampaign,
  onToggleCampaign,
  onDeleteCampaign,
}: {
  campaigns: Campaign[];
  reach: number;
  onAddCampaign: (d: NewCampaign) => Promise<void>;
  onToggleCampaign: (c: Campaign) => Promise<void>;
  onDeleteCampaign: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="page">
      <div className="toolbar">
        <div className="grow minw0">
          <h2 className="card-title">Акции и кампании</h2>
          <p className="muted">
            {`Уведомление получат ${reach} ${plural(reach, "клиент", "клиента", "клиентов")} программы`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={18} /> <span className="hide-sm">Новая акция</span>
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="card">
          <Empty
            icon={<Megaphone size={22} />}
            title="Акций пока нет"
            text="Например, «−20% на кофе по будням». Клиенты сразу увидят её у себя в кабинете."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
                <Plus size={16} /> Создать акцию
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid-cards">
          {campaigns.map((c, i) => {
            const roi = c.budget > 0 ? Math.round(((c.expectedRevenue - c.budget) / c.budget) * 100) : null;
            const left = daysLeft(c.endDate);
            const active = c.status === "Активна";
            return (
              <article key={c.id} className={active ? "camp-card" : "camp-card done"} style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div className="camp-stripe" />
                <div className="row between">
                  <h3 className="minw0">{c.name}</h3>
                  <span className={active ? "badge badge-active" : "badge badge-basic"}>{active ? "● Активна" : "Завершена"}</span>
                </div>
                {c.description && <p className="camp-desc">{c.description}</p>}
                <div>
                  <div className="progress">
                    <span style={{ width: `${progress(c)}%` }} />
                  </div>
                  <div className="row between muted mt-xs">
                    <span className="row gap-xs">
                      <CalendarDays size={13} /> {formatDate(c.startDate)} — {formatDate(c.endDate)}
                    </span>
                    <span>{left > 0 ? `${left} ${plural(left, "день", "дня", "дней")}` : left === 0 ? "последний день" : "закончилась"}</span>
                  </div>
                </div>
                {(c.budget > 0 || c.expectedRevenue > 0) && (
                  <div className="mini-stats two">
                    <div>
                      <b>{money(c.budget)}</b>
                      <small>бюджет</small>
                    </div>
                    <div>
                      <b className="pos">{money(c.expectedRevenue)}</b>
                      <small>ожидаем{roi !== null ? ` · ROI ${roi}%` : ""}</small>
                    </div>
                  </div>
                )}
                <div className="row gap end">
                  <button className="btn btn-secondary btn-sm" onClick={() => onToggleCampaign(c)}>
                    {active ? <Pause size={15} /> : <Play size={15} />} {active ? "Завершить" : "Возобновить"}
                  </button>
                  <button
                    className="icon-btn danger"
                    aria-label="Удалить акцию"
                    onClick={() => {
                      if (window.confirm(`Удалить акцию «${c.name}»?`)) onDeleteCampaign(c.id);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && <CampaignModal reach={reach} onClose={() => setOpen(false)} onSubmit={onAddCampaign} />}
    </div>
  );
}

function CampaignModal({ reach, onClose, onSubmit }: { reach: number; onClose: () => void; onSubmit: (d: NewCampaign) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(dateNow());
  const [endDate, setEndDate] = useState(addDays(14));
  const [budget, setBudget] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <Modal title="Новая акция" subtitle={`Уведомление уйдёт ${reach} ${plural(reach, "клиенту", "клиентам", "клиентам")}`} onClose={onClose}>
      <div className="chips">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            type="button"
            className={name === t.name ? "chip active" : "chip"}
            onClick={() => {
              setName(t.name);
              setDescription(t.description);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (endDate < startDate) return setError("Дата окончания раньше даты начала.");
          setSaving(true);
          await onSubmit({
            name: name.trim(),
            description: description.trim(),
            startDate,
            endDate,
            budget: Number(budget) || 0,
            expectedRevenue: Number(expectedRevenue) || 0,
            status: "Активна",
          });
          setSaving(false);
          onClose();
        }}
      >
        <Input label="Название" value={name} onChange={setName} placeholder="−20% по будням" />
        <Textarea label="Что увидят клиенты" value={description} onChange={setDescription} placeholder="Условия акции одной-двумя фразами" />
        <div className="form-row">
          <Input label="Начало" type="date" value={startDate} onChange={setStartDate} />
          <Input label="Конец" type="date" value={endDate} onChange={setEndDate} />
        </div>
        <div className="form-row">
          <Input label="Бюджет, ₸" type="number" min={0} required={false} value={budget} onChange={setBudget} placeholder="0" />
          <Input label="Ожидаемый доход, ₸" type="number" min={0} required={false} value={expectedRevenue} onChange={setExpectedRevenue} placeholder="0" />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner /> : <><Send size={16} /> Запустить</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
