import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Printer } from 'lucide-react';
import api, { formatCurrency, formatCurrencyDecimal, formatDate } from '@/lib/api';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/customers/export/data');
      setCustomers(res.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    if (!customers.length) { toast.error('No data to export'); return; }
    const headers = ['Name', 'Age', 'Monthly Amount', 'Tenure (Years)', 'Interest Rate', 'Start Date', 'Maturity Date', 'Total Deposit', 'Total Interest', 'Maturity Amount'];
    const rows = customers.map(c => [
      c.name, c.age, c.monthly_amount, c.tenure, c.interest_rate,
      formatDate(c.start_date), formatDate(c.maturity_date),
      c.total_deposit, c.total_interest, c.maturity_amount,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rd_customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportPDF = async () => {
    if (!customers.length) { toast.error('No data to export'); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('PostalRD Pro - Customer Report', 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 22);
      autoTable(doc, {
        startY: 28,
        head: [['Name', 'Age', 'Monthly Amt', 'Tenure', 'Rate', 'Start Date', 'Maturity Date', 'Total Deposit', 'Interest', 'Maturity Amt']],
        body: customers.map(c => [
          c.name, c.age, c.monthly_amount, `${c.tenure}Y`, `${c.interest_rate}%`,
          formatDate(c.start_date), formatDate(c.maturity_date),
          c.total_deposit, c.total_interest?.toFixed(2), c.maturity_amount?.toFixed(2),
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      doc.save(`rd_customers_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('PDF export failed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-10" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Export and print customer data</p>
        </div>
        <div className="flex gap-3 no-print">
          <Button variant="outline" onClick={exportCSV} data-testid="export-csv-btn" className="text-slate-700">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} data-testid="export-pdf-btn" className="text-slate-700">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={handlePrint} data-testid="print-btn" className="bg-postal-red hover:bg-postal-red-600 text-white">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
        <SummaryCard label="Total Customers" value={customers.length} />
        <SummaryCard label="Total Monthly Collection" value={formatCurrency(customers.reduce((s, c) => s + c.monthly_amount, 0))} />
        <SummaryCard label="Total Deposits" value={formatCurrency(customers.reduce((s, c) => s + (c.total_deposit || 0), 0))} />
        <SummaryCard label="Total Maturity Value" value={formatCurrency(customers.reduce((s, c) => s + (c.maturity_amount || 0), 0))} />
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 no-print">
          <CardTitle className="font-heading text-base text-slate-800">Customer RD Sheet</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">#</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monthly</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenure</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maturity</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Deposit</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Interest</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Maturity Amt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-12 text-slate-400">No customers to display</TableCell></TableRow>
                ) : (
                  customers.map((c, idx) => (
                    <TableRow key={c.id} className="table-row-animate" data-testid={`report-row-${c.id}`}>
                      <TableCell className="text-sm text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-slate-800">{c.name}</TableCell>
                      <TableCell className="text-slate-600">{c.age}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{formatCurrency(c.monthly_amount)}</TableCell>
                      <TableCell className="text-slate-600">{c.tenure}Y</TableCell>
                      <TableCell className="text-slate-600">{c.interest_rate}%</TableCell>
                      <TableCell className="text-slate-600">{formatDate(c.start_date)}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(c.maturity_date)}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{formatCurrency(c.total_deposit)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-700">{formatCurrencyDecimal(c.total_interest)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-800">{formatCurrencyDecimal(c.maturity_amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="metric-card">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900 font-heading mt-1">{value}</p>
    </div>
  );
}
