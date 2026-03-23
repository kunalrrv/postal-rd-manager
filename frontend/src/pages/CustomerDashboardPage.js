import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, Calendar, TrendingUp, CheckCircle, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import api, { formatCurrency, formatCurrencyDecimal, formatDate } from '@/lib/api';
import { toast } from 'sonner';

export default function CustomerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/customer/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6" data-testid="customer-dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="metric-card animate-pulse"><div className="h-20 bg-slate-100 rounded" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Unable to load your dashboard. Please contact your agent.</p>
      </div>
    );
  }

  const { customer, payments, summary } = data;
  const progressPct = summary.total_payments > 0 ? (summary.paid_count / summary.total_payments) * 100 : 0;

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return p.status === 'Unpaid' && new Date(p.due_date) < new Date();
    return p.status === filter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-5 sm:space-y-6" data-testid="customer-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">
            Welcome, {customer.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Your Recurring Deposit summary</p>
        </div>
        <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 w-fit">
          <Clock className="w-3 h-3 mr-1" /> {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>

      {/* Maturity Hero Card */}
      <Card className="border-0 shadow-lg bg-official-blue text-white overflow-hidden" data-testid="maturity-hero">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-1">
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">Maturity Amount</p>
              <p className="text-3xl sm:text-4xl font-bold font-heading" data-testid="hero-maturity-amount">
                {formatCurrencyDecimal(summary.maturity_amount)}
              </p>
              <p className="text-sm text-blue-200 mt-2">@ {summary.interest_rate}% p.a.</p>
            </div>
            <div className="sm:col-span-1 space-y-3">
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">Total Deposit</p>
                <p className="text-lg font-semibold">{formatCurrency(summary.total_deposit_expected)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">Amount Paid So Far</p>
                <p className="text-lg font-semibold">{formatCurrency(summary.total_paid_amount)}</p>
              </div>
            </div>
            <div className="sm:col-span-1 space-y-3">
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">RD Tenure</p>
                <p className="text-lg font-semibold">{customer.tenure} Years</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wider">Maturity Date</p>
                <p className="text-lg font-semibold">{formatDate(customer.maturity_date)}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blue-200">Payment Progress</span>
              <span className="font-medium">{summary.paid_count} / {summary.total_payments} installments</span>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-3">
              <div
                className="bg-emerald-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" data-testid="summary-cards">
        <SummaryCard
          label="Monthly RD"
          value={formatCurrency(customer.monthly_amount)}
          icon={IndianRupee}
          color="text-official-blue"
          bg="bg-official-blue-50"
        />
        <SummaryCard
          label="Paid Installments"
          value={summary.paid_count}
          icon={CheckCircle}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <SummaryCard
          label="Remaining"
          value={summary.unpaid_count}
          icon={CreditCard}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <SummaryCard
          label="Overdue"
          value={summary.overdue_count}
          icon={AlertTriangle}
          color="text-red-600"
          bg="bg-red-50"
        />
      </div>

      {/* Next Payment Due */}
      {summary.next_payment && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm" data-testid="next-payment-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Next Payment Due</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatCurrency(summary.next_payment.amount_due)}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    due {formatDate(summary.next_payment.due_date)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">{summary.next_payment.month_label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RD Details */}
      <Card className="border-slate-200 shadow-sm" data-testid="rd-details-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-official-blue" /> RD Account Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoItem label="Start Date" value={formatDate(customer.start_date)} />
            <InfoItem label="Maturity Date" value={formatDate(customer.maturity_date)} />
            <InfoItem label="Interest Rate" value={`${customer.interest_rate}% p.a.`} />
            <InfoItem label="Monthly Amount" value={formatCurrency(customer.monthly_amount)} />
            <InfoItem label="Tenure" value={`${customer.tenure} Years`} />
            <InfoItem label="Total Deposit" value={formatCurrency(customer.total_deposit)} />
            <InfoItem label="Total Interest" value={formatCurrencyDecimal(customer.total_interest)} />
            <InfoItem label="Maturity Amount" value={formatCurrencyDecimal(customer.maturity_amount)} highlight />
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-slate-200 shadow-sm" data-testid="payment-history-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="font-heading text-base text-slate-800">Payment History</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 h-9 text-sm" data-testid="customer-payment-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({payments.length})</SelectItem>
                <SelectItem value="Paid">Paid ({summary.paid_count})</SelectItem>
                <SelectItem value="Unpaid">Unpaid ({summary.unpaid_count})</SelectItem>
                <SelectItem value="overdue">Overdue ({summary.overdue_count})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 sticky top-0">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">#</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount Due</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount Paid</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No payments to display
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((p, idx) => {
                    const isOverdue = p.status === 'Unpaid' && new Date(p.due_date) < new Date();
                    return (
                      <TableRow
                        key={p.id}
                        className={`table-row-animate ${isOverdue ? 'bg-red-50/50' : ''}`}
                        data-testid={`customer-payment-row-${p.id}`}
                      >
                        <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                        <TableCell className="text-sm text-slate-700 font-medium">{p.month_label}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-slate-700">
                          {formatCurrency(p.amount_due)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-slate-700">
                          {p.amount_paid ? formatCurrency(p.amount_paid) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {p.payment_date ? formatDate(p.payment_date) : '-'}
                        </TableCell>
                        <TableCell>
                          {p.status === 'Paid' ? (
                            <span className="badge-paid">Paid</span>
                          ) : isOverdue ? (
                            <span className="badge-overdue">Overdue</span>
                          ) : (
                            <span className="badge-unpaid">Upcoming</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="metric-card" data-testid={`summary-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 font-heading">{value}</p>
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
