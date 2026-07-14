import { useState } from 'react';
import { TrendingUp, Ticket, Percent, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';

const trendBars = [
  { date: '07-10', issued: 120, redeemed: 68 },
  { date: '07-11', issued: 85, redeemed: 52 },
  { date: '07-12', issued: 200, redeemed: 145 },
  { date: '07-13', issued: 150, redeemed: 98 },
  { date: '07-14', issued: 310, redeemed: 210 },
  { date: '07-15', issued: 180, redeemed: 125 },
  { date: '07-16', issued: 256, redeemed: 162 },
];

const maxVal = Math.max(...trendBars.map((d) => Math.max(d.issued, d.redeemed)));

export default function DashboardPage() {
  const { coupons } = useStore();
  const [timeRange, setTimeRange] = useState('7d');

  const totalIssued = coupons.filter((c) => c.status !== 'pending' && c.status !== 'deleted').length;
  const totalFaceValue = coupons.reduce((sum, c) => sum + c.faceValue, 0);
  const totalDeducted = coupons.reduce((sum, c) => sum + (c.faceValue - c.remainingValue), 0);
  const redemptionRate = totalFaceValue > 0 ? Math.round((totalDeducted / totalFaceValue) * 1000) / 10 : 0;
  const frozenCount = coupons.filter((c) => c.status === 'frozen').length;
  const expiredAmount = coupons.filter((c) => c.status === 'expired').reduce((sum, c) => sum + c.remainingValue, 0);
  const splitUsageRatio = totalDeducted > 0
    ? Math.round((coupons.filter((c) => c.splitEnabled).reduce((sum, c) => sum + (c.faceValue - c.remainingValue), 0) / totalDeducted) * 1000) / 10
    : 0;

  const typeDistribution = [
    { name: '普通券', value: coupons.filter((c) => c.couponType === 'normal').length, color: '#0c8ce8' },
    { name: '新客券', value: coupons.filter((c) => c.couponType === 'newcomer').length, color: '#35af61' },
    { name: '活动券', value: coupons.filter((c) => c.couponType === 'campaign').length, color: '#f59e0b' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">数据看板</h1>
          <p className="text-sm text-slate-500 mt-1">优惠券核心运营指标一览</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {[
            { key: 'today', label: '今日' },
            { key: '7d', label: '近7天' },
            { key: '30d', label: '近30天' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTimeRange(item.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-all',
                timeRange === item.key ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '累计发放量', value: totalIssued.toLocaleString(), unit: '张', icon: Ticket, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: '核销率', value: `${redemptionRate}%`, unit: '', icon: Percent, color: 'text-accent-600', bg: 'bg-accent-50' },
          { label: '抵扣总金额', value: formatCurrency(totalDeducted), unit: '', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '冻结券数', value: frozenCount.toLocaleString(), unit: '张', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', kpi.bg)}>
                <kpi.icon className={cn('w-5 h-5', kpi.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{kpi.label}</p>
                <p className="text-xl font-bold text-slate-900">
                  {kpi.value}
                  {kpi.unit && <span className="text-sm font-normal text-slate-400 ml-1">{kpi.unit}</span>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">发放面额总额</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{formatCurrency(totalFaceValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">拆分使用占比</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{splitUsageRatio}%</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider">过期作废金额</p>
          <p className="text-lg font-semibold text-red-600 mt-1">{formatCurrency(expiredAmount)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">发放与核销趋势</h3>
          <div className="flex items-end gap-3 h-[280px]">
            {trendBars.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: `${(d.issued / maxVal) * 200}px` }}>
                  <div className="w-full bg-brand-200 rounded-t-sm" style={{ height: `${(d.issued / (d.issued + d.redeemed)) * 100}%` }} />
                  <div className="w-full bg-brand-500 rounded-b-sm" style={{ height: `${(d.redeemed / (d.issued + d.redeemed)) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-400 mt-2">{d.date}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-brand-500" /><span className="text-xs text-slate-500">核销量</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-brand-200" /><span className="text-xs text-slate-500">发放量</span></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">券类型分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                {typeDistribution.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value) => [`${value} 张`, '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e5ea', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '13px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
