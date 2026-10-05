import React, { useState } from "react";
import {
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { NewTransaction, Transaction, TransactionType } from "../types";
import { compact, dateNow } from "../utils";
import {
  Empty,
  Input,
  Modal,
  Segmented,
  Spinner,
  Stat,
} from "../components/ui";
import { TxRow } from "./Home";

const CATEGORIES: Record<TransactionType, string[]> = {
  income: ["Продажи", "Доставка", "Кейтеринг", "Прочее"],
  expense: ["Аренда", "Зарплата", "Закупки", "Маркетинг", "Коммуналка"],
};

export default function FinancesView({
  transactions,
  totalIncome,
  totalExpense,
  netProfit,
  onAddTransaction,
  onDeleteTransaction,
}: {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  onAddTransaction: (d: NewTransaction) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const list = transactions.filter(
    (t) => filter === "all" || t.type === filter
  );
  const margin =
    totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  return (
    <div className="page">
      <div className="stat-grid">
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
          hint={totalIncome > 0 ? `маржа ${margin}%` : undefined}
        />
        <Stat
          title="Операций"
          value={transactions.length}
          icon={<Receipt size={18} />}
          tone="cyan"
        />
      </div>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Операции</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} /> Добавить
          </button>
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Все" },
            { value: "income", label: "Доходы" },
            { value: "expense", label: "Расходы" },
          ]}
        />
        {list.length === 0 ? (
          <Empty
            icon={<Receipt size={22} />}
            title="Операций нет"
            text="Добавьте доход или расход — прибыль посчитается сама."
          />
        ) : (
          <div className="list mt">
            {list.map((t) => (
              <TxRow
                key={t.id}
                t={t}
                action={
                  <button
                    className="icon-btn danger sm"
                    aria-label="Удалить операцию"
                    onClick={() => {
                      if (window.confirm("Удалить операцию?"))
                        onDeleteTransaction(t.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      {open && (
        <TransactionModal
          onClose={() => setOpen(false)}
          onSubmit={onAddTransaction}
        />
      )}
    </div>
  );
}

function TransactionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (d: NewTransaction) => Promise<void>;
}) {
  const [type, setType] = useState<TransactionType>("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Продажи");
  const [date, setDate] = useState(dateNow());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title="Новая операция" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const value = Number(amount.replace(",", "."));
          if (!value || value <= 0) return;
          setSaving(true);
          await onSubmit({
            type,
            amount: value,
            category,
            date,
            description: description.trim(),
          });
          setSaving(false);
          onClose();
        }}
      >
        <Segmented
          value={type}
          onChange={(v) => {
            setType(v);
            setCategory(CATEGORIES[v][0]);
          }}
          options={[
            { value: "income", label: "Доход" },
            { value: "expense", label: "Расход" },
          ]}
        />
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
          {CATEGORIES[type].map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "chip active" : "chip"}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="form-row">
          <Input label="Категория" value={category} onChange={setCategory} />
          <Input label="Дата" type="date" value={date} onChange={setDate} />
        </div>
        <Input
          label="Комментарий"
          required={false}
          value={description}
          onChange={setDescription}
          placeholder="Например: выручка за смену"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !amount}
          >
            {saving ? <Spinner /> : "Добавить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
