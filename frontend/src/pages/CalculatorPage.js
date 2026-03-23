import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, IndianRupee, TrendingUp, Calendar } from 'lucide-react';
import api, { formatCurrencyDecimal } from '@/lib/api';
import { toast } from 'sonner';

export default function CalculatorPage() {
  const [monthlyDeposit, setMonthlyDeposit] = useState('1000');
  const [tenure, setTenure] = useState('5');
  const [rate, setRate] = useState('6.7');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!monthlyDeposit || parseFloat(monthlyDeposit) <= 0) {
      toast.error('Enter a valid monthly deposit amount');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/calculator', {
        monthly_deposit: parseFloat(monthlyDeposit),
        tenure_years: parseInt(tenure),
        annual_rate: parseFloat(rate),
      });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10" data-testid="calculator-page">
      <div className="mb-5 sm:mb-6">
        <h1 className="font-heading font-bold text-xl sm:text-2xl lg:text-3xl text-slate-900">RD Calculator</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Calculate Recurring Deposit maturity amount</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        {/* Input Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-base text-slate-800 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-official-blue" /> Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Monthly Deposit Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{'\u20B9'}</span>
                <Input
                  data-testid="calc-deposit"
                  type="number"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(e.target.value)}
                  className="pl-8 h-11"
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Tenure</Label>
              <Select value={tenure} onValueChange={setTenure}>
                <SelectTrigger className="h-11" data-testid="calc-tenure">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Years (60 months)</SelectItem>
                  <SelectItem value="10">10 Years (120 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-700">Annual Interest Rate (%)</Label>
              <Input
                data-testid="calc-rate"
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-11"
              />
            </div>
            <Button
              onClick={handleCalculate}
              disabled={loading}
              data-testid="calc-submit"
              className="w-full h-11 bg-postal-red hover:bg-postal-red-600 text-white font-medium"
            >
              {loading ? 'Calculating...' : 'Calculate Maturity'}
            </Button>
          </CardContent>
        </Card>

        {/* Result Card */}
        <Card className={`border-slate-200 shadow-sm transition-all ${result ? 'opacity-100' : 'opacity-50'}`}>
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-base text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Maturity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-5" data-testid="calc-result">
                <div className="bg-official-blue rounded-xl p-6 text-white text-center">
                  <p className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">Maturity Amount</p>
                  <p className="text-3xl font-bold font-heading" data-testid="maturity-amount">{formatCurrencyDecimal(result.maturity_amount)}</p>
                </div>
                <div className="space-y-4">
                  <ResultRow label="Monthly Deposit" value={formatCurrencyDecimal(result.monthly_deposit)} icon={<IndianRupee className="w-4 h-4 text-slate-400" />} />
                  <Separator className="bg-slate-100" />
                  <ResultRow label="Total Deposit" value={formatCurrencyDecimal(result.total_deposit)} icon={<IndianRupee className="w-4 h-4 text-slate-400" />} />
                  <Separator className="bg-slate-100" />
                  <ResultRow label="Total Interest Earned" value={formatCurrencyDecimal(result.total_interest)} icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} highlight />
                  <Separator className="bg-slate-100" />
                  <ResultRow label="Tenure" value={`${result.tenure_years} Years (${result.total_months} months)`} icon={<Calendar className="w-4 h-4 text-slate-400" />} />
                  <Separator className="bg-slate-100" />
                  <ResultRow label="Interest Rate" value={`${result.annual_rate}% p.a. (Quarterly Compounding)`} icon={<TrendingUp className="w-4 h-4 text-slate-400" />} />
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                <Calculator className="w-10 h-10 mb-3 text-slate-200" />
                <p className="text-sm">Enter values and click Calculate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultRow({ label, value, icon, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}
