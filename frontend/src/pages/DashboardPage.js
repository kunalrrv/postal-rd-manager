import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, IndianRupee, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { formatCurrency, formatDate } from '@/lib/api';
import { toast } from 'sonner';

const PIE_COLORS = ['#059669', '#D97706'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="metric-card animate-pulse"><div className="h-20 bg-slate-100 rounded" /></div>
          ))}
        </div>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Customers', value: stats?.total_customers || 0, icon: Users, color: 'text-official-blue', bg: 'bg-official-blue-50' },
    { label: 'Monthly Expected', value: formatCurrency(stats?.total_monthly_expected), icon: IndianRupee, color: 'text-postal-red', bg: 'bg-postal-red-50' },
    { label: 'Paid This Month', value: formatCurrency(stats?.total_paid_amount), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${stats?.total_paid_count || 0} payments` },
    { label: 'Unpaid This Month', value: stats?.unpaid_count || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', sub: `${stats?.overdue_count || 0} overdue` },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-5 sm:space-y-6" data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Overview of your RD collection status</p>
        </div>
        <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 w-fit">
          <Clock className="w-3 h-3 mr-1" /> {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" data-testid="metric-cards">
        {metricCards.map((card, idx) => (
          <div key={idx} className={`metric-card animate-fade-in-up stagger-${idx + 1}`} data-testid={`metric-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{card.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1 font-heading">{card.value}</p>
                {card.sub && <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{card.sub}</p>}
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-5">
        {/* Monthly Collection Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm" data-testid="monthly-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-official-blue" /> Monthly Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.monthly_chart?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.monthly_chart}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20B9${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Collected']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#1E3A8A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No payment data yet. Mark payments as paid to see collection trends.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paid vs Unpaid */}
        <Card className="border-slate-200 shadow-sm" data-testid="paid-unpaid-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base text-slate-800">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.paid_vs_unpaid?.[0]?.value > 0 || stats?.paid_vs_unpaid?.[1]?.value > 0) ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.paid_vs_unpaid}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.paid_vs_unpaid.map((entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span className="text-slate-600">Paid ({stats?.paid_vs_unpaid?.[0]?.value || 0})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-amber-600" />
                    <span className="text-slate-600">Unpaid ({stats?.paid_vs_unpaid?.[1]?.value || 0})</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
                No payment data for current month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
        {/* Upcoming Maturity */}
        <Card className="border-slate-200 shadow-sm" data-testid="upcoming-maturity">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base text-slate-800">Upcoming Maturity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats?.upcoming_maturity?.length > 0 ? (
              <div className="space-y-3">
                {stats.upcoming_maturity.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">Matures {formatDate(c.maturity_date)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{formatCurrency(c.maturity_amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No upcoming maturity in next 6 months</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Unpaid */}
        <Card className="border-slate-200 shadow-sm" data-testid="recent-unpaid">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base text-slate-800">Unpaid This Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats?.recent_unpaid?.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_unpaid.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.customer_name}</p>
                      <p className="text-xs text-slate-400">{p.month_label}</p>
                    </div>
                    <span className="badge-unpaid">{formatCurrency(p.amount_due)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">All payments collected this month</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
