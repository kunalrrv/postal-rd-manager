import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import api, { formatCurrency, formatDate } from '@/lib/api';
import { toast } from 'sonner';

const emptyForm = { name: '', age: '', monthly_amount: '', tenure: '5', interest_rate: '7.6', start_date: null };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tenureFilter, setTenureFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">Customers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{customers.length} total customers</p>
        </div>
        <Button onClick={openAdd} data-testid="add-customer-btn" className="bg-postal-red hover:bg-postal-red-600 text-white w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
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
    </div>
  );
}
