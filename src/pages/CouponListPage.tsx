import { useMemo, useState } from 'react';
import { Search, Snowflake, Eye, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useStore } from '../lib/store';
import { formatCurrency, formatDateShort, cn } from '../lib/utils';
import { COUPON_STATUS_MAP, COUPON_TYPE_MAP, type Coupon } from '../types';

const PAGE_SIZE = 10;

export default function CouponListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [page, setPage] = useState(1);
  const { coupons } = useStore();

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (search && !c.couponId.includes(search) && !c.merchantName?.includes(search)) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.couponType !== typeFilter) return false;
      return true;
    });
  }, [search, statusFilter, typeFilter, coupons]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">优惠券管理</h1>
        <p className="text-sm text-slate-500 mt-1">查看全量优惠券生命周期状态和使用记录</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总券数', value: coupons.length, unit: '张' },
          { label: '已发放', value: coupons.filter((c) => c.status === 'issued' || c.status === 'part_used').length, unit: '张' },
          { label: '已核销', value: coupons.filter((c) => c.status === 'fully_used').length, unit: '张' },
          { label: '冻结/过期', value: coupons.filter((c) => c.status === 'frozen' || c.status === 'expired').length, unit: '张' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">
              {stat.value}<span className="text-sm font-normal text-slate-400 ml-1">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索券ID或商户名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="all">全部状态</option>
            {Object.entries(COUPON_STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange(setTypeFilter, e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-brand-400"
          >
            <option value="all">全部类型</option>
            {Object.entries(COUPON_TYPE_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">券 ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">模板</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">面额</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">剩余</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">商户号</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">商户名称</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">有效期</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">类型</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-light)]">
              {paged.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-500 max-w-[180px] truncate" title={coupon.couponId}>
                    {coupon.couponId}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{coupon.templateName}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(coupon.faceValue)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={cn(
                      'font-medium',
                      coupon.remainingValue === 0 ? 'text-slate-400' : 'text-accent-600',
                    )}>
                      {formatCurrency(coupon.remainingValue)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500">{coupon.merchantId || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{coupon.merchantName || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={coupon.status} label={COUPON_STATUS_MAP[coupon.status]} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDateShort(coupon.expireTime)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{COUPON_TYPE_MAP[coupon.couponType]}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedCoupon(coupon)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">暂无匹配的优惠券</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-light)] bg-white">
            <span className="text-sm text-slate-500">
              共 {filtered.length} 条，第 {safePage}/{totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm font-medium transition-colors',
                    p === safePage
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedCoupon && (
        <CouponDetailDrawer coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
      )}
    </div>
  );
}

function CouponDetailDrawer({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const { freezeCoupon, unfreezeCoupon } = useStore();
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showUnfreezeModal, setShowUnfreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeError, setFreezeError] = useState('');

  const usagePercent = coupon.faceValue > 0
    ? Math.round(((coupon.faceValue - coupon.remainingValue) / coupon.faceValue) * 100)
    : 0;

  const handleFreeze = () => {
    if (!freezeReason.trim()) {
      setFreezeError('请输入冻结原因');
      return;
    }
    freezeCoupon(coupon.id, freezeReason.trim());
    setShowFreezeModal(false);
    setFreezeReason('');
    setFreezeError('');
    onClose();
  };

  const handleUnfreeze = () => {
    unfreezeCoupon(coupon.id);
    setShowUnfreezeModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 animate-slide-up overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">优惠券详情</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={cn(
            'rounded-xl p-4',
            coupon.status === 'issued' && 'bg-brand-50 border border-brand-100',
            coupon.status === 'part_used' && 'bg-accent-50 border border-accent-100',
            coupon.status === 'fully_used' && 'bg-slate-50 border border-slate-100',
            coupon.status === 'expired' && 'bg-red-50 border border-red-100',
            coupon.status === 'frozen' && 'bg-amber-50 border border-amber-100',
            (coupon.status === 'pending') && 'bg-slate-50 border border-slate-100',
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">当前状态</p>
                <StatusBadge status={coupon.status} label={COUPON_STATUS_MAP[coupon.status]} className="mt-1 text-sm px-3 py-1" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(coupon.faceValue)}</p>
                {coupon.splitEnabled && coupon.remainingValue < coupon.faceValue && (
                  <p className="text-sm text-slate-500">剩余 {formatCurrency(coupon.remainingValue)}</p>
                )}
              </div>
            </div>

            {coupon.splitEnabled && coupon.status !== 'pending' && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>已使用 {usagePercent}%</span>
                  <span>剩余 {formatCurrency(coupon.remainingValue)}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="券 ID" value={coupon.couponId} mono />
            <InfoItem label="权益编码" value={coupon.rightsCode} mono />
            <InfoItem label="券类型" value={COUPON_TYPE_MAP[coupon.couponType]} />
            <InfoItem label="模板名称" value={coupon.templateName} />
            <InfoItem label="面额" value={formatCurrency(coupon.faceValue)} />
            <InfoItem label="剩余面额" value={formatCurrency(coupon.remainingValue)} />
            <InfoItem label="有效期" value={formatDateShort(coupon.expireTime)} />
            <InfoItem label="拆分功能" value={coupon.splitEnabled ? `启用 (≥¥${coupon.minSplitAmount})` : '关闭'} />
            <InfoItem label="持有商户" value={coupon.merchantName || '—'} />
            <InfoItem label="发放时间" value={coupon.issuedAt ? formatDateShort(coupon.issuedAt) : '—'} />
            <InfoItem label="发放渠道" value={coupon.issuedChannel === 'manual' ? '定向发放' : coupon.issuedChannel === 'auto' ? '自动发放' : coupon.issuedChannel === 'campaign' ? '活动发放' : '—'} />
          </div>

          {/* Freeze Info */}
          {coupon.status === 'frozen' && coupon.frozenReason && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800">冻结信息</p>
              <p className="text-sm text-amber-700 mt-1">冻结时间：{coupon.frozenAt ? formatDateShort(coupon.frozenAt) : '—'}</p>
              <p className="text-sm text-amber-700">冻结原因：{coupon.frozenReason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {(coupon.status === 'issued' || coupon.status === 'part_used') && (
              <Button variant="danger" size="sm" onClick={() => setShowFreezeModal(true)}>
                <Snowflake className="w-4 h-4" />
                冻结券
              </Button>
            )}
            {coupon.status === 'frozen' && (
              <Button variant="secondary" size="sm" onClick={() => setShowUnfreezeModal(true)}>解冻券</Button>
            )}
          </div>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      {showFreezeModal && (
        <FreezeModal
          couponId={coupon.couponId}
          freezeReason={freezeReason}
          freezeError={freezeError}
          onChangeReason={(v) => { setFreezeReason(v); setFreezeError(''); }}
          onConfirm={handleFreeze}
          onCancel={() => { setShowFreezeModal(false); setFreezeReason(''); setFreezeError(''); }}
        />
      )}

      {/* Unfreeze Confirmation Modal */}
      {showUnfreezeModal && (
        <UnfreezeModal
          couponId={coupon.couponId}
          frozenReason={coupon.frozenReason}
          onConfirm={handleUnfreeze}
          onCancel={() => setShowUnfreezeModal(false)}
        />
      )}
    </>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm text-slate-800 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</p>
    </div>
  );
}

/* ── Freeze Confirmation Modal ── */
function FreezeModal({
  couponId,
  freezeReason,
  freezeError,
  onChangeReason,
  onConfirm,
  onCancel,
}: {
  couponId: string;
  freezeReason: string;
  freezeError: string;
  onChangeReason: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[60] animate-fade-in" onClick={onCancel} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">确认冻结优惠券</h3>
              <p className="text-sm text-red-600">冻结后该券将暂停使用，需谨慎操作</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">券 ID</span>
                <span className="font-mono text-slate-700">{couponId}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                冻结原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={freezeReason}
                onChange={(e) => onChangeReason(e.target.value)}
                placeholder="请输入冻结原因，例如：涉嫌风险交易、商户申诉处理中..."
                rows={3}
                maxLength={200}
                className={cn(
                  'w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none',
                  freezeError
                    ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-[var(--color-border)] focus:border-brand-400 focus:ring-brand-100',
                )}
              />
              {freezeError && <p className="text-xs text-red-500">{freezeError}</p>}
              <p className="text-xs text-slate-400">{freezeReason.length}/200</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-[var(--color-border-light)] flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={onCancel}>取消</Button>
            <Button variant="danger" size="sm" onClick={onConfirm}>
              <Snowflake className="w-4 h-4" />
              确认冻结
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Unfreeze Confirmation Modal ── */
function UnfreezeModal({
  couponId,
  frozenReason,
  onConfirm,
  onCancel,
}: {
  couponId: string;
  frozenReason?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[60] animate-fade-in" onClick={onCancel} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="bg-accent-50 px-6 py-4 border-b border-accent-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-accent-800">确认解冻优惠券</h3>
              <p className="text-sm text-accent-600">解冻后将恢复券的正常使用状态</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">券 ID</span>
                <span className="font-mono text-slate-700">{couponId}</span>
              </div>
              {frozenReason && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">冻结原因</span>
                  <span className="text-amber-700 max-w-[220px] text-right">{frozenReason}</span>
                </div>
              )}
            </div>

            <div className="bg-accent-50 border border-accent-100 rounded-lg p-3">
              <p className="text-sm text-accent-700">
                解冻后，该优惠券将恢复到冻结前的状态，商户可继续正常使用。
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-[var(--color-border-light)] flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={onCancel}>取消</Button>
            <Button variant="primary" size="sm" onClick={onConfirm}>
              <ShieldCheck className="w-4 h-4" />
              确认解冻
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
