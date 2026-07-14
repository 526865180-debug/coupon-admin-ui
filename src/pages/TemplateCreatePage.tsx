import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Copy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useStore } from '../lib/store';
import type { CouponTemplate } from '../types';

function generateTemplateId(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `TPL_${dateStr}_${seq}`;
}

export default function TemplateCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copyId = searchParams.get('copy');
  const { addTemplate, templates } = useStore();

  // Find source template for copy mode
  const sourceTemplate = useMemo(() => {
    if (!copyId) return null;
    return templates.find((t) => t.id === copyId) || null;
  }, [copyId, templates]);

  const isCopyMode = !!sourceTemplate;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: sourceTemplate ? `${sourceTemplate.name}（副本）` : '',
    faceValue: sourceTemplate ? String(sourceTemplate.faceValue) : '',
    expireType: (sourceTemplate?.expireType || 'fixed') as 'fixed' | 'relative',
    expireStart: sourceTemplate?.expireStart || '',
    expireEnd: sourceTemplate?.expireEnd || '',
    validDays: sourceTemplate?.validDays ? String(sourceTemplate.validDays) : '30',
    bizScenes: (sourceTemplate?.bizScenes || []) as string[],
    merchantScopeType: (sourceTemplate?.merchantScopeType || 'all') as string,
    deductionLimit: sourceTemplate?.deductionLimit ? String(sourceTemplate.deductionLimit) : '',
    splitEnabled: sourceTemplate?.splitEnabled || false,
    minSplitAmount: sourceTemplate?.minSplitAmount ? String(sourceTemplate.minSplitAmount) : '',
    couponType: (sourceTemplate?.couponType || 'normal') as string,
    remark: sourceTemplate?.remark || '',
  });

  const toggleBizScene = (scene: string) => {
    setForm((prev) => ({
      ...prev,
      bizScenes: prev.bizScenes.includes(scene)
        ? prev.bizScenes.filter((s) => s !== scene)
        : [...prev.bizScenes, scene],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = '模板名称不能为空';
    if (!form.faceValue || parseFloat(form.faceValue) <= 0) newErrors.faceValue = '面额必须为正数';
    if (form.expireType === 'fixed') {
      if (!form.expireStart) newErrors.expireStart = '请选择开始日期';
      if (!form.expireEnd) newErrors.expireEnd = '请选择结束日期';
      if (form.expireStart && form.expireEnd && form.expireStart >= form.expireEnd) newErrors.expireEnd = '结束日期必须晚于开始日期';
    } else {
      if (!form.validDays || parseInt(form.validDays) <= 0) newErrors.validDays = '有效天数必须为正整数';
    }
    if (form.bizScenes.length === 0) newErrors.bizScenes = '至少选择一个业务场景';
    if (form.splitEnabled && (!form.minSplitAmount || parseFloat(form.minSplitAmount) <= 0)) {
      newErrors.minSplitAmount = '最小拆分金额必须为正数';
    }
    if (form.splitEnabled && parseFloat(form.minSplitAmount) > parseFloat(form.faceValue)) {
      newErrors.minSplitAmount = '最小拆分金额不能超过面额';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Build template
    const now = new Date().toISOString();
    const template: CouponTemplate = {
      id: generateTemplateId(),
      name: form.name.trim(),
      faceValue: parseFloat(form.faceValue),
      expireType: form.expireType,
      expireStart: form.expireType === 'fixed' ? form.expireStart : undefined,
      expireEnd: form.expireType === 'fixed' ? form.expireEnd : undefined,
      validDays: form.expireType === 'relative' ? parseInt(form.validDays) : undefined,
      bizScenes: form.bizScenes as ('payment' | 'collection' | 'fx_settlement')[],
      merchantScopeType: form.merchantScopeType as 'all' | 'specific' | 'group' | 'tag',
      deductionLimit: form.deductionLimit ? parseFloat(form.deductionLimit) : undefined,
      splitEnabled: form.splitEnabled,
      minSplitAmount: form.splitEnabled ? parseFloat(form.minSplitAmount) : undefined,
      couponType: form.couponType as 'normal' | 'newcomer' | 'campaign',
      status: 'active',
      remark: form.remark || undefined,
      createdBy: '当前用户',
      createdAt: now,
      updatedAt: now,
    };

    addTemplate(template);
    navigate('/templates');
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/templates')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
            {isCopyMode ? '复制优惠券模板' : '新建优惠券模板'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isCopyMode
              ? `基于模板「${sourceTemplate?.name}」创建副本，修改后保存即可`
              : '配置模板参数，后续批量生成优惠券将继承这些规则'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">基础信息</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">模板名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如：2025春节大促券"
                maxLength={50}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-[var(--color-border)]'}`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">面额 (元) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.faceValue}
                onChange={(e) => setForm({ ...form, faceValue: e.target.value })}
                placeholder="100.00"
                min="0.01"
                step="0.01"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all ${errors.faceValue ? 'border-red-300 bg-red-50' : 'border-[var(--color-border)]'}`}
              />
              {errors.faceValue && <p className="text-xs text-red-500">{errors.faceValue}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">券类型 <span className="text-red-500">*</span></label>
              <select
                value={form.couponType}
                onChange={(e) => setForm({ ...form, couponType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="normal">普通券</option>
                <option value="newcomer">新客券</option>
                <option value="campaign">活动券</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">适用商户范围 <span className="text-red-500">*</span></label>
              <select
                value={form.merchantScopeType}
                onChange={(e) => setForm({ ...form, merchantScopeType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              >
                <option value="all">全部商户</option>
                <option value="specific">指定商户</option>
                <option value="group">指定分组</option>
                <option value="tag">指定标签</option>
              </select>
            </div>
          </div>

          {/* Biz Scenes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">适用业务场景 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {[
                { key: 'payment', label: '付款' },
                { key: 'collection', label: '收款' },
                { key: 'fx_settlement', label: '结汇' },
              ].map((scene) => (
                <button
                  key={scene.key}
                  type="button"
                  onClick={() => toggleBizScene(scene.key)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                    form.bizScenes.includes(scene.key)
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-[var(--color-border)] bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {scene.label}
                </button>
              ))}
            </div>
            {errors.bizScenes && <p className="text-xs text-red-500">{errors.bizScenes}</p>}
          </div>
        </div>

        {/* Validity */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">有效期设置</h2>

          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="expireType"
                  value="fixed"
                  checked={form.expireType === 'fixed'}
                  onChange={() => setForm({ ...form, expireType: 'fixed' })}
                  className="accent-brand-600"
                />
                <span className="text-sm text-slate-700">固定日期</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="expireType"
                  value="relative"
                  checked={form.expireType === 'relative'}
                  onChange={() => setForm({ ...form, expireType: 'relative' })}
                  className="accent-brand-600"
                />
                <span className="text-sm text-slate-700">相对天数（自发放日起算）</span>
              </label>
            </div>

            {form.expireType === 'fixed' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">开始日期</label>
                  <input
                    type="date"
                    value={form.expireStart}
                    onChange={(e) => setForm({ ...form, expireStart: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">结束日期</label>
                  <input
                    type="date"
                    value={form.expireEnd}
                    onChange={(e) => setForm({ ...form, expireEnd: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full md:w-1/2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700">有效天数</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.validDays}
                    onChange={(e) => setForm({ ...form, validDays: e.target.value })}
                    min="1"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all ${errors.validDays ? 'border-red-300 bg-red-50' : 'border-[var(--color-border)]'}`}
                  />
                  <span className="text-sm text-slate-500 whitespace-nowrap">天</span>
                </div>
                {errors.validDays && <p className="text-xs text-red-500">{errors.validDays}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Split & Deduction */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">抵扣与拆分设置</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">单笔抵扣上限 (元)</label>
              <input
                type="number"
                value={form.deductionLimit}
                onChange={(e) => setForm({ ...form, deductionLimit: e.target.value })}
                placeholder="留空表示不限制"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <p className="text-xs text-slate-400">留空表示不限制单笔抵扣上限</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.splitEnabled}
                onChange={(e) => setForm({ ...form, splitEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-brand-600"
              />
              <span className="text-sm font-medium text-slate-700">启用面额拆分</span>
              <span className="text-xs text-slate-400">开启后，单张券可分多笔交易核销</span>
            </label>

            {form.splitEnabled && (
              <div className="w-full md:w-1/2 space-y-1.5 pl-7">
                <label className="text-sm font-medium text-slate-700">最小拆分抵扣金额 (元) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={form.minSplitAmount}
                  onChange={(e) => setForm({ ...form, minSplitAmount: e.target.value })}
                  placeholder="10.00"
                  min="0.01"
                  step="0.01"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all ${errors.minSplitAmount ? 'border-red-300 bg-red-50' : 'border-[var(--color-border)]'}`}
                />
                {errors.minSplitAmount && <p className="text-xs text-red-500">{errors.minSplitAmount}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Remark */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">备注</h2>
          <textarea
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            placeholder="内部备注，不超过 200 字"
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate('/templates')}>取消</Button>
          <Button type="submit">
            {isCopyMode ? (
              <>
                <Copy className="w-4 h-4" />
                保存副本
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存模板
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
