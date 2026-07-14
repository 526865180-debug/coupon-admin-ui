import { useState } from 'react';
import { Gift, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { mockCoupons } from '../lib/mock-data';
import { formatCurrency, formatDateShort, daysUntil, cn } from '../lib/utils';
import { COUPON_STATUS_MAP, COUPON_TYPE_MAP, type Coupon } from '../types';

const merchantCoupons = mockCoupons.filter((c) => c.merchantId === 'M001');

export default function MerchantWalletPage() {
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [filter, setFilter] = useState<'available' | 'used' | 'expired'>('available');

  const filtered = merchantCoupons.filter((c) => {
    if (filter === 'available') return c.status === 'issued' || c.status === 'part_used';
    if (filter === 'used') return c.status === 'fully_used';
    if (filter === 'expired') return c.status === 'expired' || c.status === 'frozen';
    return true;
  });

  return (
    <div className="animate-fade-in min-h-[100dvh] bg-[var(--color-surface)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold text-slate-900">我的优惠券</h1>
          <p className="text-sm text-slate-500 mt-0.5">深圳跨境贸易有限公司</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">可用优惠券</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {merchantCoupons.filter((c) => c.status === 'issued' || c.status === 'part_used').length}
                <span className="text-base font-normal text-slate-400 ml-1">张</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
              <Gift className="w-6 h-6 text-brand-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white rounded-xl border border-[var(--color-border)] p-1">
          {[
            { key: 'available' as const, label: '可用' },
            { key: 'used' as const, label: '已用完' },
            { key: 'expired' as const, label: '已过期/冻结' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex-1 py-2 text-sm rounded-lg transition-all',
                filter === tab.key ? 'bg-brand-600 text-white font-medium shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Coupon Cards */}
        <div className="space-y-3">
          {filtered.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onClick={() => setSelectedCoupon(coupon)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-12 text-center">
              <Gift className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 mt-3">暂无优惠券</p>
              <p className="text-xs text-slate-300 mt-1">平台发放的优惠券将在这里展示</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedCoupon && (
        <CouponDetailSheet coupon={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
      )}
    </div>
  );
}

function CouponCard({ coupon, onClick }: { coupon: Coupon; onClick: () => void }) {
  const usagePercent = coupon.faceValue > 0
    ? Math.round(((coupon.faceValue - coupon.remainingValue) / coupon.faceValue) * 100)
    : 0;
  const daysLeft = daysUntil(coupon.expireTime);
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0 && (coupon.status === 'issued' || coupon.status === 'part_used');
  const isUnavailable = coupon.status === 'frozen' || coupon.status === 'fully_used' || coupon.status === 'expired';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white rounded-2xl border transition-all duration-200 overflow-hidden',
        isExpiringSoon ? 'border-amber-300 ring-1 ring-amber-200' : 'border-[var(--color-border)]',
        isUnavailable ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 rounded-md text-xs font-medium',
              coupon.couponType === 'normal' ? 'bg-brand-50 text-brand-700' :
              coupon.couponType === 'newcomer' ? 'bg-accent-50 text-accent-700' :
              'bg-amber-50 text-amber-700',
            )}>
              {COUPON_TYPE_MAP[coupon.couponType]}
            </span>
            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                <Clock className="w-3 h-3" />
                即将过期
              </span>
            )}
            {coupon.status === 'frozen' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                已冻结
              </span>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>

        <p className="text-3xl font-bold text-slate-900 mt-3">{formatCurrency(coupon.faceValue)}</p>

        {coupon.splitEnabled && coupon.status === 'part_used' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>已用 {formatCurrency(coupon.faceValue - coupon.remainingValue)}</span>
              <span>剩余 {formatCurrency(coupon.remainingValue)}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm">
          <span className={isExpiringSoon ? 'text-amber-600 font-medium' : 'text-slate-400'}>
            有效期至 {formatDateShort(coupon.expireTime)}
          </span>
          <span className="text-slate-400">{COUPON_STATUS_MAP[coupon.status]}</span>
        </div>
      </div>
    </button>
  );
}

function CouponDetailSheet({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85dvh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-[var(--color-border-light)] px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">券详情</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">{COUPON_TYPE_MAP[coupon.couponType]} · {COUPON_STATUS_MAP[coupon.status]}</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">{formatCurrency(coupon.faceValue)}</p>
            {coupon.remainingValue < coupon.faceValue && (
              <p className="text-sm text-slate-500 mt-1">剩余 {formatCurrency(coupon.remainingValue)}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">券 ID</span><span className="font-mono text-xs text-slate-700">{coupon.couponId}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">有效期</span><span className="text-slate-700">{formatDateShort(coupon.expireTime)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">发放时间</span><span className="text-slate-700">{coupon.issuedAt ? formatDateShort(coupon.issuedAt) : '—'}</span></div>
          </div>

          {coupon.status === 'frozen' && coupon.frozenReason && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800">冻结原因</p>
              <p className="text-sm text-amber-700 mt-1">{coupon.frozenReason}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
