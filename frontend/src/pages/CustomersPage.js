import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, CalendarIcon, Users, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import api, { formatCurrency, formatDate } from '@/lib/api';
import { toast } from 'sonner';

const emptyForm = { name: '', age: '', monthly_amount: '', tenure: '5', interest_rate: '6.7', start_date: null };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenureFilter, setTenureFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchTenure = tenureFilter === 'all' || c.tenure === parseInt(tenureFilter);
    return matchSearch && matchTenure;
  });

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      age: String(c.age),
      monthly_amount: String(c.monthly_amount),
      tenure: String(c.tenure),
      interest_rate: String(c.interest_rate),
      start_date: new Date(c.start_date),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.age || !form.monthly_amount || !form.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        age: parseInt(form.age),
        monthly_amount: parseFloat(form.monthly_amount),
        tenure: parseInt(form.tenure),
        interest_rate: parseFloat(form.interest_rate),
        start_date: format(form.start_date, 'yyyy-MM-dd'),
      };
      if (editId) {
        await api.put(`/customers/${editId}`, payload);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer added');
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer and all payment records?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  // ===== CSV Import Functions =====
  const CSV_HEADERS = ['Name', 'Age', 'Monthly Amount', 'Tenure', 'Interest Rate', 'Start Date'];

  const downloadTemplate = () => {
    const csv = [
      CSV_HEADERS.join(','),
      'Rajesh Kumar,45,1000,5,6.7,2025-01-01',
      'Priya Sharma,38,2000,10,6.7,2025-03-15',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rd_customers_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return { rows: [], errors: ['CSV must have a header row and at least one data row'] };

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = header.findIndex(h => h.includes('name'));
    const ageIdx = header.findIndex(h => h.includes('age'));
    const amountIdx = header.findIndex(h => h.includes('amount') || h.includes('monthly'));
    const tenureIdx = header.findIndex(h => h.includes('tenure'));
    const rateIdx = header.findIndex(h => h.includes('rate') || h.includes('interest'));
    const dateIdx = header.findIndex(h => h.includes('date') || h.includes('start'));

    if (nameIdx === -1 || amountIdx === -1 || dateIdx === -1) {
      return { rows: [], errors: ['CSV must have Name, Monthly Amount, and Start Date columns'] };
    }

    const rows = [];
    const errors = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const row = {
        name: cols[nameIdx] || '',
        age: parseInt(cols[ageIdx]) || 0,
        monthly_amount: parseFloat(cols[amountIdx]) || 0,
        tenure: parseInt(cols[tenureIdx]) || 5,
        interest_rate: parseFloat(cols[rateIdx]) || 6.7,
        start_date: cols[dateIdx] || '',
        _row: i + 1,
        _errors: [],
      };
      if (!row.name) row._errors.push('Name required');
      if (row.monthly_amount <= 0) row._errors.push('Invalid amount');
      if (![5, 10].includes(row.tenure)) row._errors.push('Tenure must be 5 or 10');
      if (!row.start_date || !/^\d{4}-\d{2}-\d{2}/.test(row.start_date)) row._errors.push('Date format: YYYY-MM-DD');
      if (row._errors.length) errors.push(`Row ${i + 1}: ${row._errors.join(', ')}`);
      rows.push(row);
    }
    return { rows, errors };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, errors } = parseCSV(ev.target.result);
      setCsvRows(rows);
      setCsvErrors(errors);
      setImportResult(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    const validRows = csvRows.filter(r => r._errors.length === 0);
    if (!validRows.length) {
      toast.error('No valid rows to import');
      return;
    }
    setImporting(true);
    try {
      const payload = validRows.map(({ _row, _errors, ...rest }) => rest);
      const res = await api.post('/customers/import', { customers: payload });
      setImportResult(res.data);
      if (res.data.success > 0) {
        toast.success(`${res.data.success} customer(s) imported successfully`);
        fetchCustomers();
      }
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} row(s) failed`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const openImportDialog = () => {
    setCsvRows([]);
    setCsvErrors([]);
    setImportResult(null);
    setImportOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">Customers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{customers.length} total customers</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={openImportDialog} data-testid="import-csv-btn" className="flex-1 sm:flex-initial text-slate-700">
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button onClick={openAdd} data-testid="add-customer-btn" className="bg-postal-red hover:bg-postal-red-600 text-white flex-1 sm:flex-initial">
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            data-testid="customer-search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={tenureFilter} onValueChange={setTenureFilter}>
          <SelectTrigger className="w-40 h-10" data-testid="tenure-filter">
            <SelectValue placeholder="All Tenures" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenures</SelectItem>
            <SelectItem value="5">5 Years</SelectItem>
            <SelectItem value="10">10 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monthly RD</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenure</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Maturity Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Maturity Amt</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">{search ? 'No matching customers' : 'No customers yet. Add your first customer.'}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="table-row-animate cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)} data-testid={`customer-row-${c.id}`}>
                      <TableCell className="font-medium text-slate-800">{c.name}</TableCell>
                      <TableCell className="text-slate-600">{c.age}</TableCell>
                      <TableCell className="text-right font-mono text-slate-700">{formatCurrency(c.monthly_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.tenure}Y</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{formatDate(c.start_date)}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(c.maturity_date)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-800">{formatCurrency(c.maturity_amount)}</TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`customer-actions-${c.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/customers/${c.id}`)} data-testid={`view-customer-${c.id}`}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(c)} data-testid={`edit-customer-${c.id}`}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-red-600" data-testid={`delete-customer-${c.id}`}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md" data-testid="customer-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editId ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Name *</Label>
              <Input data-testid="input-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-700">Age *</Label>
                <Input data-testid="input-age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Age" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-700">Monthly Amount *</Label>
                <Input data-testid="input-amount" type="number" value={form.monthly_amount} onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })} placeholder="\u20B9 Amount" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-700">Tenure</Label>
                <Select value={form.tenure} onValueChange={(v) => setForm({ ...form, tenure: v })}>
                  <SelectTrigger data-testid="input-tenure"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-slate-700">Interest Rate (%)</Label>
                <Input data-testid="input-rate" type="number" step="0.1" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-10" data-testid="input-startdate">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    {form.start_date ? format(form.start_date, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.start_date} onSelect={(d) => setForm({ ...form, start_date: d })} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-btn">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-customer-btn" className="bg-postal-red hover:bg-postal-red-600 text-white">
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] flex flex-col" data-testid="import-csv-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Import Customers from CSV</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Upload a CSV file with customer data. Columns: Name, Age, Monthly Amount, Tenure (5 or 10), Interest Rate, Start Date (YYYY-MM-DD).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Actions Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="download-template-btn" className="text-slate-600">
                <Download className="w-4 h-4 mr-2" /> Download Template
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" data-testid="csv-file-input" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="select-csv-btn" className="text-slate-600">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Select CSV File
              </Button>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`rounded-lg p-3 text-sm ${importResult.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`} data-testid="import-result">
                <div className="flex items-center gap-2 font-medium mb-1">
                  {importResult.failed > 0 ? <AlertCircle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  <span>{importResult.success} imported, {importResult.failed} failed</span>
                </div>
                {importResult.errors?.length > 0 && (
                  <ul className="text-xs text-amber-700 mt-1 space-y-0.5 pl-6 list-disc">
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* Validation Errors */}
            {csvErrors.length > 0 && !importResult && (
              <div className="rounded-lg p-3 bg-red-50 border border-red-200 text-sm" data-testid="csv-errors">
                <div className="flex items-center gap-2 font-medium text-red-700 mb-1">
                  <AlertCircle className="w-4 h-4" /> Validation Issues
                </div>
                <ul className="text-xs text-red-600 mt-1 space-y-0.5 pl-6 list-disc">
                  {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {/* CSV Preview Table */}
            {csvRows.length > 0 && !importResult && (
              <div className="border rounded-lg overflow-hidden" data-testid="csv-preview">
                <div className="px-3 py-2 bg-slate-50 border-b flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    {csvRows.length} row(s) found &middot; {csvRows.filter(r => r._errors.length === 0).length} valid
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs font-semibold text-slate-500 w-8">#</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Age</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 text-right">Monthly</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Tenure</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Rate</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Start Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvRows.map((row, idx) => (
                        <TableRow key={idx} className={row._errors.length ? 'bg-red-50/50' : ''} data-testid={`csv-row-${idx}`}>
                          <TableCell className="text-xs text-slate-400">{row._row}</TableCell>
                          <TableCell className="text-sm text-slate-800 font-medium">{row.name || '-'}</TableCell>
                          <TableCell className="text-sm text-slate-600">{row.age || '-'}</TableCell>
                          <TableCell className="text-sm text-slate-700 text-right font-mono">{row.monthly_amount || '-'}</TableCell>
                          <TableCell className="text-sm text-slate-600">{row.tenure}Y</TableCell>
                          <TableCell className="text-sm text-slate-600">{row.interest_rate}%</TableCell>
                          <TableCell className="text-sm text-slate-600">{row.start_date || '-'}</TableCell>
                          <TableCell>
                            {row._errors.length ? (
                              <span className="badge-overdue text-[10px]" title={row._errors.join(', ')}>Error</span>
                            ) : (
                              <span className="badge-paid text-[10px]">Valid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {csvRows.length === 0 && !importResult && (
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="csv-dropzone"
              >
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">Click to select a CSV file</p>
                <p className="text-xs text-slate-400 mt-1">or download the template first</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} data-testid="import-cancel-btn">
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {!importResult && csvRows.length > 0 && (
              <Button
                onClick={handleImport}
                disabled={importing || csvRows.filter(r => r._errors.length === 0).length === 0}
                data-testid="import-submit-btn"
                className="bg-postal-red hover:bg-postal-red-600 text-white"
              >
                {importing ? 'Importing...' : `Import ${csvRows.filter(r => r._errors.length === 0).length} Customer(s)`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
