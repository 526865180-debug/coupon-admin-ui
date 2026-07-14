import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useStore } from '../lib/store';
import { formatCurrency, cn } from '../lib/utils';
import { COUPON_TYPE_MAP, COUPON_STATUS_MAP } from '../types';

export default function IssuePage() {
  const navigate = useNavigate();
  const { coupons, issueCoupons } = useStore();

  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [merchantInput, setMerchantInput] = useState('');
  const [merchants, setMerchants] = useState<{ id: string; name: string }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<{ merchant: string; success: number; skip: number; reasons: string[] }[]>([]);

  // Only show pending coupons
  const availableCoupons = useMemo(
    () => coupons.filter((c) => c.status === 'pending'),
    [coupons],
  );

  const selectedCoupons = useMemo(
    () => availableCoupons.filter((c) => selectedIds.includes(c.id)),
    [availableCoupons, selectedIds],
  );

  const handleAddMerchant = () => {
    const entries = merchantInput.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const newMerchants = entries.map((e) => {
      // Support "ID 名称" or just "ID" format
      const parts = e.split(/\s+/);
      return { id: parts[0], name: parts[1] || parts[0] };
    });
    setMerchants((prev) => {
      const existing = new Set(prev.map((m) => m.id));
      const toAdd = newMerchants.filter((m) => !existing.has(m.id));
      return [...prev, ...toAdd];
    });
    setMerchantInput('');
  };

  const handleIssue = () => {
    const allResults = merchants.map((m) => {
      const result = issueCoupons(
        selectedIds,
        m.id,
        m.name,
        'manual',
        '当前用户',
      );
      return { merchant: `${m.name}(${m.id})`, ...result };
    });
    setResults(allResults);
    setShowResult(true);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedIds([]);
    setMerchants([]);
    setShowResult(false);
    setResults([]);
  };

  const totalSuccess = results.reduce((s, r) => s + r.success, 0);
  const totalSkip = results.reduce((s, r) => s + r.skip, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">优惠券发放</h1>
        <p className="text-sm text-slate-500 mt-1">选择待发放优惠券，定向发放给目标商户</p>
      </div>

      {/* Step Indicator */}
      {!showResult && (
        <div className="flex items-center gap-2">
          {['选择优惠券', '选择商户', '确认发放'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                step > i + 1 ? 'bg-accent-500 text-white' : step === i + 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400',
              )}>
                {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn('text-sm', step === i + 1 ? 'text-slate-900 font-medium' : 'text-slate-400')}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Select Coupons */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
             可选优惠券（{availableCoupons.length} 张，状态为「待发放」）
            </p>
            {availableCoupons.length === 0 && (
              <Button size="sm" variant="secondary" onClick={() => navigate('/templates')}>
                去生成优惠券
              </Button>
            )}
          </div>
          {availableCoupons.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">暂无待发放的优惠券</p>
              <p className="text-slate-300 text-xs mt-1">请先在「券模板管理」中批量生成优惠券</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] text-xs font-medium text-slate-500 uppercase tracking-wider items-center">
                <span className="w-4"></span>
                <span>券 ID</span>
                <span>模板</span>
                <span className="text-right">面额</span>
                <span>券类型</span>
                <span>状态</span>
              </div>
              <div className="divide-y divide-[var(--color-border-light)] max-h-[480px] overflow-y-auto">
              {availableCoupons.map((c) => (
                <label key={c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => {
                      setSelectedIds((prev) =>
                        prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                      );
                    }}
                    className="w-4 h-4 rounded accent-brand-600"
                  />
                  <div className="flex-1 grid grid-cols-5 gap-3 text-sm items-center">
                    <span className="font-mono text-xs text-slate-500 truncate" title={c.couponId}>{c.couponId.slice(-16)}</span>
                    <span className="font-medium text-slate-900 truncate">{c.templateName}</span>
                    <span className="text-slate-600 font-semibold text-right">{formatCurrency(c.faceValue)}</span>
                    <StatusBadge status={c.couponType} label={COUPON_TYPE_MAP[c.couponType]} />
                    <StatusBadge status={c.status} label={COUPON_STATUS_MAP[c.status]} />
                  </div>
                </label>
              ))}
            </div>
            </>
          )}
          <div className="p-4 border-t border-[var(--color-border)] flex justify-between">
            <span className="text-sm text-slate-500">已选 {selectedIds.length} 张</span>
            <Button disabled={selectedIds.length === 0} onClick={() => setStep(2)}>
              下一步：选择商户
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Merchants */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">已选优惠券（{selectedCoupons.length} 张）</p>
            <div className="flex flex-wrap gap-2">
              {selectedCoupons.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs rounded-md font-mono">
                  {c.couponId.slice(-12)} ({formatCurrency(c.faceValue)})
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              输入商户（每行一个，格式：商户ID 商户名称，或仅商户ID）
            </label>
            <textarea
              value={merchantInput}
              onChange={(e) => setMerchantInput(e.target.value)}
              placeholder={"M005 成都跨境贸易有限公司\nM008 南京跨境供应链有限公司"}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none font-mono"
            />
            <Button variant="secondary" size="sm" onClick={handleAddMerchant}>
              <Users className="w-4 h-4" />
              添加商户
            </Button>
          </div>

          {merchants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">目标商户（{merchants.length} 户）</p>
              <div className="flex flex-wrap gap-2">
                {merchants.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                    {m.name} ({m.id})
                    <button
                      onClick={() => setMerchants((prev) => prev.filter((x) => x.id !== m.id))}
                      className="text-slate-400 hover:text-red-500 ml-0.5"
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-[var(--color-border-light)]">
            <Button variant="ghost" onClick={() => setStep(1)}>上一步</Button>
            <Button disabled={merchants.length === 0} onClick={() => setStep(3)}>
              下一步：确认发放
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && !showResult && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">确认发放信息</p>
              <p className="mt-1">即将向 {merchants.length} 个商户发放 {selectedCoupons.length} 张优惠券（每个商户各 {selectedCoupons.length} 张），请仔细核对后再确认。</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">发放券数：</span><span className="font-medium">{selectedCoupons.length} 张/户</span></div>
            <div><span className="text-slate-500">目标商户：</span><span className="font-medium">{merchants.length} 户</span></div>
            <div><span className="text-slate-500">总发放量：</span><span className="font-medium">{selectedCoupons.length * merchants.length} 张</span></div>
            <div><span className="text-slate-500">发放渠道：</span><span className="font-medium">定向发放</span></div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">目标商户列表</p>
            <div className="flex flex-wrap gap-1.5">
              {merchants.map((m) => (
                <span key={m.id} className="px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-600">{m.name}</span>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[var(--color-border-light)]">
            <Button variant="ghost" onClick={() => setStep(2)}>上一步</Button>
            <Button onClick={handleIssue}>
              <Send className="w-4 h-4" />
              确认发放
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-accent-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">发放完成</h3>
              <p className="text-sm text-slate-500">
                成功发放 {totalSuccess} 张，跳过 {totalSkip} 张
              </p>
            </div>
          </div>

          {/* Per-merchant details */}
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{r.merchant}</span>
                  <span className="text-sm">
                    <span className="text-accent-600 font-medium">{r.success} 成功</span>
                    {r.skip > 0 && <span className="text-red-500 ml-2">{r.skip} 跳过</span>}
                  </span>
                </div>
                {r.reasons.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {r.reasons.map((reason, j) => (
                      <p key={j} className="text-xs text-red-500">{reason}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleReset}>继续发放</Button>
            <Button variant="ghost" onClick={() => navigate('/records')}>查看发放记录</Button>
          </div>
        </div>
      )}
    </div>
  );
}
