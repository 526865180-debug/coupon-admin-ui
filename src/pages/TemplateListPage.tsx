import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useStore } from '../lib/store';
import { formatCurrency, formatDateShort, cn } from '../lib/utils';
import type { CouponTemplate } from '../types';

export default function TemplateListPage() {
  const { templates } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.name.includes(search) && !t.id.includes(search)) return false;
      if (typeFilter !== 'all' && t.couponType !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [search, typeFilter, statusFilter, templates]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">券模板管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理优惠券模板，快速复用创建标准化优惠券</p>
        </div>
        <Button onClick={() => navigate('/templates/new')}>
          <Plus className="w-4 h-4" />
          新建模板
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索模板名称或ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="all">全部类型</option>
            <option value="normal">普通券</option>
            <option value="newcomer">新客券</option>
            <option value="campaign">活动券</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="all">全部状态</option>
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">模板 ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">模板名称</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">面额</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">券类型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">有效期</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">拆分</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">创建人</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">创建时间</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {filtered.map((tpl) => (
                <TemplateRow key={tpl.id} template={tpl} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">
                    暂无匹配的模板
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ template: t }: { template: CouponTemplate }) {
  const navigate = useNavigate();
  const { updateTemplate } = useStore();
  const typeMap: Record<string, string> = { normal: '普通券', newcomer: '新客券', campaign: '活动券' };

  const handleToggleStatus = () => {
    updateTemplate(t.id, { status: t.status === 'active' ? 'inactive' : 'active' });
  };

  const handleCopy = () => {
    navigate(`/templates/new?copy=${t.id}`);
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-slate-500">{t.id}</td>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">{t.name}</td>
      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(t.faceValue)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={t.couponType} label={typeMap[t.couponType]} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {t.expireType === 'fixed'
          ? `${formatDateShort(t.expireStart!)} ~ ${formatDateShort(t.expireEnd!)}`
          : `发放后 ${t.validDays} 天`}
      </td>
      <td className="px-4 py-3 text-sm">
        {t.splitEnabled ? (
          <span className="text-accent-600 font-medium">启用 (≥¥{t.minSplitAmount})</span>
        ) : (
          <span className="text-slate-400">关闭</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={t.status} label={t.status === 'active' ? '启用' : '停用'} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{t.createdBy}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{formatDateShort(t.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/templates/${t.id}`)}
            className="px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
          >
            详情
          </button>
          {t.status === 'active' && (
            <button
              onClick={() => navigate(`/templates/${t.id}/generate`)}
              className="px-2.5 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-md transition-colors"
            >
              生成券
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
          >
            复制
          </button>
          <button
            onClick={handleToggleStatus}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
              t.status === 'active'
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-accent-600 hover:bg-accent-50',
            )}
          >
            {t.status === 'active' ? '停用' : '启用'}
          </button>
        </div>
      </td>
    </tr>
  );
}
