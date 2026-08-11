import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  QrCode,
  Send,
} from 'lucide-react';

interface LinkedAccount {
  id: string;
  label: string;
  subtitle: string;
  status: string;
  badge?: string;
}

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  type: 'credit' | 'debit';
}

interface CardInfo {
  provider: string;
  holder: string;
  number: string;
  validThru: string;
  cvv: string;
}

const linkedAccounts: LinkedAccount[] = [
  {
    id: 'account-1',
    label: 'Premium Debit',
    subtitle: '•••• 4242 · Exp 12/26',
    status: 'Manage',
    badge: 'VISA',
  },
  {
    id: 'account-2',
    label: 'HDFC Savings',
    subtitle: '•••• 0912 · Verified',
    status: 'Manage',
    badge: 'Bank',
  },
];

const transactions: Transaction[] = [
  {
    id: 'txn-1',
    title: 'Apple Store Online',
    subtitle: 'Electronics & Gear',
    date: 'Oct 24, 2023',
    amount: '₹1,29,900',
    status: 'completed',
    type: 'debit',
  },
  {
    id: 'txn-2',
    title: 'Dividend Payout',
    subtitle: 'Investment Yield',
    date: 'Oct 22, 2023',
    amount: '+₹4,500',
    status: 'completed',
    type: 'credit',
  },
  {
    id: 'txn-3',
    title: 'The Gourmet Bistro',
    subtitle: 'Dining',
    date: 'Oct 20, 2023',
    amount: '₹1,200',
    status: 'pending',
    type: 'debit',
  },
];

export default function WalletPage() {
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const activeCard: CardInfo = {
    provider: 'VISA',
    holder: 'Spandana',
    number: '27259097',
    validThru: '09/29',
    cvv: '249',
  };

  const maskedCardNumber = `**** **** ${activeCard.number.slice(0, 4)} ${activeCard.number.slice(4)}`;

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((txn) => txn.type === filter);

  const formatAmount = (amountInr: number) => {
    const convertedAmount = currency === 'INR' ? amountInr : amountInr / 83;

    return currency === 'INR'
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }).format(convertedAmount)
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2,
        }).format(convertedAmount);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-slate-900/80">Wallet Overview</h1>
            <p className="max-w-2xl text-sm text-slate-500">Manage your funds and linked accounts effortlessly.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            <ArrowRight className="size-4" />
            Statement
          </button>
        </section>

        <section className="space-y-6 mt-6">
          <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">

            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.7fr_auto]">
                {/* Balance card */}
                <div className="rounded-3xl bg-white p-1 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50 sm:p-6">
                  <div className="flex flex-col justify-between xl:flex-row xl:items-start">
                    <div className="space-y-9 flex flex-col justify-between mt-2">
                      <div className="inline-flex items-center rounded-full text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
                        Total Balance
                      </div>

                      <p className="text-4xl font-semibold -tracking-normal text-black/75 mt-3">
                        {formatAmount(13650)}
                      </p>

                      <p className="text-sm text-black/80 mt-5">
                        Wallet ID: WAL-10284
                      </p>
                    </div>

                    <div className="relative inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      <span className="mr-2 text-lg">
                        {currency === "INR" ? "🇮🇳" : "🇺🇸"}
                      </span>

                      <span className="pr-6">
                        {currency === "INR" ? "INR" : "USD"}
                      </span>

                      <span className="pointer-events-none absolute right-3 text-slate-400">
                        ▾
                      </span>

                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Balance actions */}
                <div className="min-h-60 w-64 rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50">
                  <div className="flex h-full flex-col">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Activity
                    </h3>

                    <div className="mt-4 grid flex-1 grid-cols-2 place-items-center gap-y-5">
                      {[
                        { icon: Plus, label: 'Add' },
                        { icon: Send, label: 'Send' },
                        { icon: Download, label: 'Receive' },
                        { icon: QrCode, label: 'Scan QR' },
                      ].map((action) => {
                        const Icon = action.icon;

                        return (
                          <button
                            key={action.label}
                            className="flex flex-col items-center gap-2 transition-transform hover:scale-105"
                          >
                            <span className="flex h-12 w-12 items-center justify-center rounded-3xl border border-slate-900/30 shadow-sm shadow-slate-900/5 hover:bg-blue-500 hover:text-white hover:border-none">
                              <Icon className="size-5" />
                            </span>

                            <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                              {action.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>    

            {/* card in use card */}
            <div className="relative h-60 w-96 rounded-3xl border border-white/60 bg-[linear-gradient(140deg,#BFE7F8_0%,#C8EFE6_45%,#D8EDC6_75%,#EEE9C7_100%)] p-6 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="h-8 w-10 rounded-md border border-yellow-500/30 bg-yellow-100 shadow-sm">
                  <div className="flex h-full items-center justify-center">
                    <div className="h-5 w-px bg-yellow-600/40" />
                  </div>
                </div>

                <p className="text-2xl font-black italic tracking-tight text-slate-700">
                  {activeCard.provider}
                </p>
              </div>

              <div className="mt-10">
                <p className="font-mono text-3xl tracking-[0.18em] text-slate-700">
                  {maskedCardNumber}
                </p>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                <div>
                  <p className="text-[10px] uppercase text-slate-500">Card Holder</p>
                  <p className="mt-1 text-lg font-medium leading-tight text-slate-700">{activeCard.holder}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-slate-500">Valid Thru</p>
                  <p className="mt-1 text-lg font-medium text-slate-700">{activeCard.validThru}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-500">CVV</p>
                  <p className="mt-1 text-lg font-medium text-slate-700">{activeCard.cvv}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 items-start xl:grid-cols-[1.15fr_1.1fr]">
            {/* Linked accounts card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500 font-semibold">Linked Accounts</p>
                  <p className="mt-2 text-sm text-slate-500">Securely manage your connected cards.</p>
                </div>
                <button className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Add New
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {linkedAccounts.map((account) => (
                  <div key={account.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-500">{account.badge}</span>
                          {account.label}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{account.subtitle}</p>
                      </div>
                      <button className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        {account.status}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500 font-semibold">Recent Transactions</p>
                  <p className="mt-2 text-sm text-slate-500">Latest movement in your wallet.</p>
                </div>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  {(['all', 'credit', 'debit'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFilter(option)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        filter === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {option === 'all' ? 'All' : option === 'credit' ? 'Credits' : 'Debits'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 divide-y divide-slate-200">
                {filteredTransactions.map((txn) => (
                  <div key={txn.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
                        {txn.type === 'credit' ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{txn.title}</p>
                        <p className="text-sm text-slate-500">{txn.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end sm:text-right">
                      <div>
                        <p className="text-sm text-slate-500">{txn.date}</p>
                        <p className="font-semibold text-slate-900">{txn.amount}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${
                          txn.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : txn.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <p>{filteredTransactions.length} transactions shown</p>
                <button className="font-semibold text-blue-600">View All History</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
