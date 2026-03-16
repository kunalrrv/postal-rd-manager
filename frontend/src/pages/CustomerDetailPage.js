import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, IndianRupee, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import api, { formatCurrency, formatCurrencyDecimal, formatDate } from '@/lib/api';
import { toast } from 'sonner';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [custRes, payRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/payments`),
      ]);
      setCustomer(custRes.data);
      setPayments(payRes.data);
    } catch {
      toast.error('Failed to load customer data');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markPayment = async (paymentId, status) => {
    try {
      await api.put(`/payments/${paymentId}`, { status });
      toast.success(`Payment marked as ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to update payment');
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') {
      return p.status === 'Unpaid' && new Date(p.due_date) < new Date();
    }
    return p.status === filter;
  });

  const paidCount = payments.filter(p => p.status === 'Paid').length;
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + (p.amount_paid || 0), 0);

  if (loading) {
    return <div className="p-6 md:p-10"><div className="animate-pulse h-40 bg-slate-100 rounded-lg" /></div>;
  }

  if (!customer) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="customer-detail-page">
      <Button variant="ghost" onClick={() => navigate('/customers')} className="mb-4 text-slate-600" data-testid="back-btn">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
      </Button>

      {/* Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-5 sm:mb-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg sm:text-xl text-slate-900">{customer.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <InfoItem label="Age" value={`${customer.age} years`} />
              <InfoItem label="Monthly RD" value={formatCurrency(customer.monthly_amount)} />
              <InfoItem label="Tenure" value={`${customer.tenure} Years`} />
              <InfoItem label="Interest Rate" value={`${customer.interest_rate}%`} />
              <InfoItem label="Start Date" value={formatDate(customer.start_date)} />
              <InfoItem label="Maturity Date" value={formatDate(customer.maturity_date)} />
              <InfoItem label="Total Deposit" value={formatCurrency(customer.total_deposit)} />
              <InfoItem label="Total Interest" value={formatCurrencyDecimal(customer.total_interest)} />
            </div>
          </CardContent>
        </Card>

        {/* Maturity Summary */}
        <Card className="border-slate-200 shadow-sm bg-official-blue text-white" data-testid="maturity-summary">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">Maturity Amount</p>
              <p className="text-3xl font-bold font-heading">{formatCurrencyDecimal(customer.maturity_amount)}</p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-blue-200">Payments Made</span>
                <span className="font-medium">{paidCount} / {payments.length}</span>
              </div>
              <div className="w-full bg-blue-800 rounded-full h-2">
                <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${payments.length ? (paidCount / payments.length) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-200">Amount Paid</span>
                <span className="font-medium">{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base text-slate-800">Payment History</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 h-9 text-sm" data-testid="payment-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 sticky top-0">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount Due</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount Paid</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => {
                  const isOverdue = p.status === 'Unpaid' && new Date(p.due_date) < new Date();
                  return (
                    <TableRow key={p.id} className={`table-row-animate ${isOverdue ? 'bg-red-50/50' : ''}`} data-testid={`payment-row-${p.id}`}>
                      <TableCell className="text-sm text-slate-700">{p.month_label}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-700">{formatCurrency(p.amount_due)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-slate-700">{p.amount_paid ? formatCurrency(p.amount_paid) : '-'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{p.payment_date ? formatDate(p.payment_date) : '-'}</TableCell>
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
                        {p.status === 'Unpaid' ? (
                          <Button size="sm" variant="outline" onClick={() => markPayment(p.id, 'Paid')} data-testid={`mark-paid-${p.id}`} className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                            <CheckCircle className="w-3 h-3 mr-1" /> Mark Paid
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => markPayment(p.id, 'Unpaid')} data-testid={`mark-unpaid-${p.id}`} className="h-7 text-xs text-slate-400 hover:text-red-600">
                            <XCircle className="w-3 h-3 mr-1" /> Undo
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}
