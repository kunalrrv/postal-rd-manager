import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle, AlertTriangle, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import api, { formatCurrency, formatDate } from '@/lib/api';
import { toast } from 'sonner';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateYears() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - 10; y <= current + 10; y++) years.push(y);
  return years;
}

export default function PaymentsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [tab, setTab] = useState('all');
  const [monthPayments, setMonthPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isCurrentMonth = selectedMonth === (now.getMonth() + 1) && selectedYear === now.getFullYear();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [monthRes, overdueRes] = await Promise.all([
        api.get(`/payments/current-month?month=${selectedMonth}&year=${selectedYear}`),
        api.get('/payments/overdue'),
      ]);
      setMonthPayments(monthRes.data);
      setOverduePayments(overdueRes.data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const markPaid = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}`, { status: 'Paid' });
      toast.success('Payment marked as paid');
      fetchPayments();
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const getFilteredPayments = () => {
    let data;
    if (tab === 'all') data = monthPayments;
    else if (tab === 'paid') data = monthPayments.filter(p => p.status === 'Paid');
    else if (tab === 'unpaid') data = monthPayments.filter(p => p.status === 'Unpaid');
    else data = overduePayments;

    return data.filter((p) => {
      const matchSearch = !search || p.customer_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const filtered = getFilteredPayments();
  const paidCount = monthPayments.filter(p => p.status === 'Paid').length;
  const unpaidCount = monthPayments.filter(p => p.status === 'Unpaid').length;
  const paidAmount = monthPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.amount_paid || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="payments-page">
      <div className="mb-5 sm:mb-6">
        <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">Payments</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Track and manage monthly RD payments</p>
      </div>

      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 sm:mb-6" data-testid="month-selector">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8 text-slate-500 hover:text-slate-700" data-testid="prev-month-btn">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-2">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="border-0 shadow-none h-8 w-[120px] sm:w-[130px] font-semibold text-slate-800 text-sm focus:ring-0" data-testid="month-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="border-0 shadow-none h-8 w-[80px] font-semibold text-slate-800 text-sm focus:ring-0" data-testid="year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateYears().map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8 text-slate-500 hover:text-slate-700" data-testid="next-month-btn">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {!isCurrentMonth && (
          <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="text-xs h-8" data-testid="go-current-month-btn">
            <CalendarDays className="w-3 h-3 mr-1.5" /> Go to Current Month
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-official-blue-50 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-official-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider truncate">Total</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 font-heading">{monthPayments.length}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider truncate">Paid</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-700 font-heading">{paidCount}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider truncate">Unpaid</p>
              <p className="text-lg sm:text-xl font-bold text-amber-700 font-heading">{unpaidCount}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider truncate">Collected</p>
              <p className="text-lg sm:text-xl font-bold text-blue-700 font-heading">{formatCurrency(paidAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <TabsList data-testid="payment-tabs">
            <TabsTrigger value="all" data-testid="tab-all">All ({monthPayments.length})</TabsTrigger>
            <TabsTrigger value="paid" data-testid="tab-paid">Paid ({paidCount})</TabsTrigger>
            <TabsTrigger value="unpaid" data-testid="tab-unpaid">Unpaid ({unpaidCount})</TabsTrigger>
            <TabsTrigger value="overdue" data-testid="tab-overdue">Overdue ({overduePayments.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              data-testid="payment-search"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        <TabsContent value={tab} className="mt-0">
          <PaymentTable
            payments={filtered}
            loading={loading}
            tab={tab}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMarkPaid={markPaid}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentTable({ payments, loading, tab, selectedMonth, selectedYear, onMarkPaid }) {
  const emptyMessage = tab === 'all'
    ? `No payments found for ${MONTH_SHORT[selectedMonth - 1]} ${selectedYear}`
    : tab === 'paid'
    ? `No paid payments in ${MONTH_SHORT[selectedMonth - 1]} ${selectedYear}`
    : tab === 'unpaid'
    ? 'All payments collected!'
    : 'No overdue payments';

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount Due</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Paid</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">{emptyMessage}</TableCell></TableRow>
              ) : (
                payments.map((p) => {
                  const isOverdue = p.status === 'Unpaid' && new Date(p.due_date) < new Date();
                  return (
                    <TableRow key={p.id} className={`table-row-animate ${isOverdue ? 'bg-red-50/50' : ''}`} data-testid={`payment-row-${p.id}`}>
                      <TableCell className="font-medium text-slate-800">{p.customer_name}</TableCell>
                      <TableCell className="text-slate-600">{p.month_label}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{formatCurrency(p.amount_due)}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{p.amount_paid ? formatCurrency(p.amount_paid) : '-'}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(p.due_date)}</TableCell>
                      <TableCell>
                        {p.status === 'Paid' ? (
                          <span className="badge-paid">Paid</span>
                        ) : isOverdue ? (
                          <span className="badge-overdue">Overdue</span>
                        ) : (
                          <span className="badge-unpaid">Unpaid</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.status === 'Unpaid' && (
                          <Button size="sm" variant="outline" onClick={() => onMarkPaid(p.id)} data-testid={`mark-paid-${p.id}`} className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                            <CheckCircle className="w-3 h-3 mr-1" /> Pay
                          </Button>
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
  );
}
