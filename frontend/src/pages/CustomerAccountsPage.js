import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Users, KeyRound, Search } from 'lucide-react';
import api, { formatDate } from '@/lib/api';
import { toast } from 'sonner';

export default function CustomerAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ customer_id: '', username: '', password: '' });

  const fetchData = useCallback(async () => {
    try {
      const [accRes, custRes] = await Promise.all([
        api.get('/admin/customer-accounts'),
        api.get('/customers'),
      ]);
      setAccounts(accRes.data);
      setCustomers(custRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const linkedCustomerIds = new Set(accounts.map(a => a.customer_id));
  const unlinkedCustomers = customers.filter(c => !linkedCustomerIds.has(c.id));

  const openCreate = () => {
    setForm({ customer_id: '', username: '', password: '' });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.customer_id || !form.username || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/customer-accounts', form);
      toast.success(res.data.message);
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId, username) => {
    if (!window.confirm(`Delete account "${username}"? The customer can no longer log in.`)) return;
    try {
      await api.delete(`/admin/customer-accounts/${accountId}`);
      toast.success('Account deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete account');
    }
  };

  const getCustomerName = (customerId) => {
    const c = customers.find(c => c.id === customerId);
    return c ? c.name : 'Unknown';
  };

  const filteredAccounts = accounts.filter(a => {
    const name = getCustomerName(a.customer_id).toLowerCase();
    const uname = a.username.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || uname.includes(q);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="customer-accounts-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">Customer Accounts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create login credentials for customers to view their RD status
          </p>
        </div>
        <Button onClick={openCreate} data-testid="create-account-btn" className="bg-postal-red hover:bg-postal-red-600 text-white">
          <UserPlus className="w-4 h-4 mr-2" /> Create Account
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            data-testid="account-search"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-official-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-official-blue" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Total Customers</p>
              <p className="text-lg font-bold text-slate-900 font-heading">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">With Accounts</p>
              <p className="text-lg font-bold text-emerald-700 font-heading">{accounts.length}</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Without Accounts</p>
              <p className="text-lg font-bold text-amber-700 font-heading">{unlinkedCustomers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base text-slate-800">Customer Login Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">Loading...</TableCell></TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <KeyRound className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        {search ? 'No matching accounts' : 'No customer accounts created yet'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((a) => (
                    <TableRow key={a.id} className="table-row-animate" data-testid={`account-row-${a.id}`}>
                      <TableCell className="font-medium text-slate-800">{getCustomerName(a.customer_id)}</TableCell>
                      <TableCell className="text-slate-600 font-mono text-sm">{a.username}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(a.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50">Active</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(a.id, a.username)}
                          className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-account-${a.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Account Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md" data-testid="create-account-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Create Customer Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Select Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedCustomers.length === 0 ? (
                    <SelectItem value="_none" disabled>All customers have accounts</SelectItem>
                  ) : (
                    unlinkedCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Username *</Label>
              <Input
                data-testid="input-account-username"
                placeholder="e.g. rajesh.kumar"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <p className="text-xs text-slate-400">Min 3 characters. Customer will use this to log in.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Password *</Label>
              <Input
                data-testid="input-account-password"
                type="password"
                placeholder="Set a password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-slate-400">Min 6 characters. Share this with the customer.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-create-btn">Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={saving}
              data-testid="submit-create-btn"
              className="bg-postal-red hover:bg-postal-red-600 text-white"
            >
              {saving ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
