import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import api, { formatCurrency, formatDate } from '@/lib/api';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [tab, setTab] = useState('current');
  const [currentPayments, setCurrentPayments] = useState([]);
  const [unpaidPayments, setUnpaidPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = useCallback(async () => {
    try {
      const [currentRes, unpaidRes, overdueRes] = await Promise.all([
        api.get('/payments/current-month'),
        api.get('/payments/unpaid'),
        api.get('/payments/overdue'),
      ]);
      setCurrentPayments(currentRes.data);
      setUnpaidPayments(unpaidRes.data);
      setOverduePayments(overdueRes.data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const getFilteredPayments = () => {
    let data;
    if (tab === 'current') data = currentPayments;
    else if (tab === 'unpaid') data = unpaidPayments;
    else data = overduePayments;

    return data.filter((p) => {
      const matchSearch = !search || p.customer_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const filtered = getFilteredPayments();
  const currentPaid = currentPayments.filter(p => p.status === 'Paid').length;
  const currentUnpaid = currentPayments.filter(p => p.status === 'Unpaid').length;

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="payments-page">
      <div className="mb-5 sm:mb-6">
        <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">Payments</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Track and manage monthly RD payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-official-blue-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-official-blue" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Current Month</p>
              <p className="text-xl font-bold text-slate-900 font-heading">{currentPayments.length}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Paid</p>
              <p className="text-xl font-bold text-emerald-700 font-heading">{currentPaid}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Unpaid</p>
              <p className="text-xl font-bold text-amber-700 font-heading">{currentUnpaid}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4" data-testid="payment-tabs">
          <TabsTrigger value="current" data-testid="tab-current">Current Month</TabsTrigger>
          <TabsTrigger value="unpaid" data-testid="tab-unpaid">Unpaid ({unpaidPayments.length})</TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue">
            Overdue ({overduePayments.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
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
          {tab === 'current' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-10" data-testid="status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value={tab} className="mt-0">
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
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                          {tab === 'current' ? 'No payments for current month' : tab === 'unpaid' ? 'All payments collected!' : 'No overdue payments'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((p) => {
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
                                <Button size="sm" variant="outline" onClick={() => markPaid(p.id)} data-testid={`mark-paid-${p.id}`} className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
