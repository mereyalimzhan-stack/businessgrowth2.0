import React, { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Download,
  Mail,
  Phone,
  Plus,
  QrCode,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { Client, ClientStatus } from "../types";
import { clientStatus, formatDate, money } from "../utils";
import {
  Avatar,
  Empty,
  Input,
  Modal,
  Spinner,
  StatusBadge,
} from "../components/ui";

type Filter = "all" | ClientStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "VIP", label: "VIP" },
  { id: "Активный", label: "Активные" },
  { id: "Обычный", label: "Новые" },
];

export default function ClientsView({
  clients,
  cashbackRate,
  onAddClient,
  onDeleteClient,
  onAddPurchase,
  onRedeem,
  onShowQr,
  initialSearch = "",
}: {
  clients: Client[];
  cashbackRate: number;
  onAddClient: (d: {
    name: string;
    phone: string;
    email: string;
  }) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onAddPurchase: (c: Client, amount: number) => Promise<void>;
  onRedeem: (c: Client, amount: number) => Promise<void>;
  onShowQr: () => void;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<Filter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [purchaseClient, setPurchaseClient] = useState<Client | null>(null);
  const [redeemClient, setRedeemClient] = useState<Client | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: clients.length,
      VIP: 0,
      Активный: 0,
      Обычный: 0,
    };
    clients.forEach((c) => {
      map[clientStatus(c.purchasesCount, c.totalSpent)] += 1;
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return clients.filter((c) => {
      const matches =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (digits.length > 2 && c.phone.replace(/\D/g, "").includes(digits));
      return (
        matches &&
        (filter === "all" ||
          clientStatus(c.purchasesCount, c.totalSpent) === filter)
      );
    });
  }, [clients, search, filter]);

  useEffect(() => {
    if (initialSearch && filtered.length === 1) setPurchaseClient(filtered[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    const head = [
      "Имя",
      "Телефон",
      "Email",
      "Код",
      "Статус",
      "Покупок",
      "Потратил",
      "Бонусы",
      "Последняя покупка",
      "Источник",
    ];
    const rows = clients.map((c) => [
      c.name,
      c.phone,
      c.email || "",
      c.code,
      clientStatus(c.purchasesCount, c.totalSpent),
      String(c.purchasesCount),
      String(c.totalSpent),
      String(c.bonusesBalance),
      c.lastPurchaseDate
        ? new Date(c.lastPurchaseDate).toLocaleDateString("ru-RU")
        : "",
      c.userId ? "QR" : "вручную",
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `klienty-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className="page">
      <div className="toolbar">
        <label className="search-box grow">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Имя, телефон или код клиента"
          />
        </label>
        <button
          className="btn btn-secondary"
          onClick={exportCsv}
          disabled={clients.length === 0}
          title="Скачать список клиентов для Excel"
        >
          <Download size={18} /> <span className="hide-sm">Excel</span>
        </button>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={18} /> <span className="hide-sm">Добавить</span>
        </button>
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? "chip active" : "chip"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <span className="chip-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <Empty
            icon={<Users size={22} />}
            title={
              clients.length === 0 ? "Клиентов пока нет" : "Никого не нашли"
            }
            text={
              clients.length === 0
                ? "Поставьте QR-код на кассу — клиенты зарегистрируются сами за 20 секунд."
                : "Попробуйте изменить запрос или фильтр."
            }
            action={
              clients.length === 0 ? (
                <button className="btn btn-primary btn-sm" onClick={onShowQr}>
                  <QrCode size={16} /> Открыть QR-код
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((c, i) => (
            <article
              key={c.id}
              className="client-card"
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <div className="client-top">
                <Avatar name={c.name} />
                <div className="grow minw0">
                  <h3 className="ellipsis">{c.name}</h3>
                  <div className="muted ellipsis row gap-xs">
                    <Phone size={12} /> {c.phone || "—"}
                  </div>
                  {c.email && (
                    <div className="muted ellipsis row gap-xs">
                      <Mail size={12} /> {c.email}
                    </div>
                  )}
                </div>
                <StatusBadge
                  status={clientStatus(c.purchasesCount, c.totalSpent)}
                />
              </div>

              <div className="client-meta">
                <span className="code-pill">#{c.code}</span>
                {c.userId ? (
                  <span className="tag tag-qr">QR</span>
                ) : (
                  <span className="tag">вручную</span>
                )}
                {c.lastPurchaseDate && (
                  <span className="muted">
                    был {formatDate(c.lastPurchaseDate)}
                  </span>
                )}
              </div>

              <div className="mini-stats">
                <div>
                  <b>{c.purchasesCount}</b>
                  <small>покупок</small>
                </div>
                <div>
                  <b>{money(c.totalSpent)}</b>
                  <small>потратил</small>
                </div>
                <div>
                  <b className="lime-text">{money(c.bonusesBalance)}</b>
                  <small>бонусы</small>
                </div>
              </div>

              <div className="row gap">
                <button
                  className="btn btn-primary btn-sm grow"
                  onClick={() => setPurchaseClient(c)}
                >
                  <Plus size={16} /> Покупка
                </button>
                <button
                  className="btn btn-secondary btn-sm grow"
                  onClick={() => setRedeemClient(c)}
                  disabled={c.bonusesBalance <= 0}
                >
                  <Coins size={16} /> Списать
                </button>
                <button
                  className="icon-btn danger"
                  aria-label="Удалить клиента"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Удалить клиента «${c.name}»? История покупок сохранится в финансах.`
                      )
                    )
                      onDeleteClient(c.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {addOpen && (
        <AddClientModal
          onClose={() => setAddOpen(false)}
          onSubmit={onAddClient}
        />
      )}
      {purchaseClient && (
        <AmountModal
          title="Новая покупка"
          client={purchaseClient}
          cashbackRate={cashbackRate}
          onClose={() => setPurchaseClient(null)}
          onSubmit={(amount) => onAddPurchase(purchaseClient, amount)}
        />
      )}
      {redeemClient && (
        <AmountModal
          title="Списать бонусы"
          client={redeemClient}
          redeem
          onClose={() => setRedeemClient(null)}
          onSubmit={(amount) => onRedeem(redeemClient, amount)}
        />
      )}
    </div>
  );
}

function AddClientModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (d: {
    name: string;
    phone: string;
    email: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal
      title="Новый клиент"
      subtitle="Удобнее, когда клиент регистрируется сам по QR — тогда он видит свои бонусы."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSubmit({ name, phone, email });
          setSaving(false);
          onClose();
        }}
      >
        <Input
          label="Имя"
          value={name}
          onChange={setName}
          placeholder="Айгерим"
          icon={<UserRound size={17} />}
          autoFocus
        />
        <Input
          label="Телефон"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+7 777 000 00 00"
          icon={<Phone size={17} />}
        />
        <Input
          label="Email (необязательно)"
          type="email"
          required={false}
          value={email}
          onChange={setEmail}
          placeholder="client@example.com"
          icon={<Mail size={17} />}
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner /> : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AmountModal({
  title,
  client,
  cashbackRate = 0,
  redeem,
  onClose,
  onSubmit,
}: {
  title: string;
  client: Client;
  cashbackRate?: number;
  redeem?: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const value = Number(amount.replace(",", "."));
  const tooMuch = !!redeem && value > client.bonusesBalance;
  const valid = amount !== "" && !isNaN(value) && value > 0 && !tooMuch;
  const quick = redeem ? [client.bonusesBalance] : [1000, 2500, 5000, 10000];

  return (
    <Modal
      title={title}
      subtitle={
        <>
          {client.name} ·{" "}
          {redeem ? (
            <>
              доступно{" "}
              <b className="lime-text">{money(client.bonusesBalance)}</b>
            </>
          ) : (
            <>кэшбэк {cashbackRate}%</>
          )}
        </>
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          setSaving(true);
          await onSubmit(value);
          setSaving(false);
          onClose();
        }}
      >
        <div className="amount-input">
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            aria-label="Сумма"
          />
          <span>₸</span>
        </div>
        <div className="chips center">
          {quick.map((q) => (
            <button
              type="button"
              key={q}
              className="chip"
              onClick={() => setAmount(String(q))}
            >
              {redeem ? "Всё" : money(q)}
            </button>
          ))}
        </div>
        {!redeem && valid && (
          <div className="bonus-preview">
            <Coins size={18} /> Клиент получит{" "}
            <b>{money((value * cashbackRate) / 100)}</b> бонусами
          </div>
        )}
        {tooMuch && (
          <div className="alert alert-error">
            Больше, чем есть на балансе клиента.
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!valid || saving}
          >
            {saving ? <Spinner /> : redeem ? "Списать" : "Провести"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
