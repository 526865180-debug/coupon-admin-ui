import { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useStore } from '../lib/store';
import { formatDateShort } from '../lib/utils';

export default function IssueRecordsPage() {
  const { issueRecords } = useStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return issueRecords.filter((r) => {
      if (search && !r.merchantName.includes(search) && !r.couponId.includes(search) && !r.merchantId.includes(search)) return false;
      return true;
    });
  }, [search]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">发放记录</h1>
          <p className="text-sm text-slate-500 mt-1">优惠券发放历史台账，支持筛选和导出</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4" />
          导出 CSV
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索商户号、商户名称或券ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">券 ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">商户号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">商户名称</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">发放渠道</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作人/规则</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">结果</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-500 max-w-[180px] truncate" title={r.couponId}>{r.couponId}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{r.merchantId}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{r.merchantName}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                      {r.channel === 'manual' ? '定向发放' : r.channel === 'auto' ? '自动发放' : '活动发放'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.operator}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.result === 'success' ? 'active' : 'expired'} label={r.result === 'success' ? '成功' : '失败'} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDateShort(r.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">暂无匹配的发放记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
