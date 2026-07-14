import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useStore } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import type { Coupon } from '../types';

function randomRightsCode(): string {
  const chars = 'abcdef0123456789';
  return 'RGT_' + Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function BatchGeneratePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, addCoupons } = useStore();
  const tpl = templates.find((t) => t.id === id);

  const [quantity, setQuantity] = useState('10');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; ids: string[] } | null>(null);

  if (!tpl) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-slate-400">模板不存在</p>
        <Button variant="ghost" onClick={() => navigate('/templates')} className="mt-4">返回列表</Button>
      </div>
    );
  }

  const handleGenerate = () => {
    const num = parseInt(quantity);
    if (isNaN(num) || num <= 0 || num > 10000) return;

    setGenerating(true);
    setProgress(0);
    setResult(null);

    // Simulate async generation with progress, then actually create coupons
    const totalSteps = 5;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setProgress(Math.round((step / totalSteps) * 100));
      if (step >= totalSteps) {
        clearInterval(interval);

        // Actually generate coupons
        const now = new Date().toISOString();
        const expireTime = tpl.expireType === 'relative'
          ? new Date(Date.now() + (tpl.validDays || 30) * 86400000).toISOString()
          : tpl.expireEnd || new Date(Date.now() + 90 * 86400000).toISOString();

        const newCoupons: Coupon[] = [];
        const ids: string[] = [];
        for (let i = 1; i <= num; i++) {
          const seq = String(i).padStart(8, '0');
          const couponId = `CPN_${tpl.id}_${seq}`;
          ids.push(couponId);
          newCoupons.push({
            id: `${Date.now()}_${i}`,
            couponId,
            rightsCode: randomRightsCode(),
            templateId: tpl.id,
            templateName: tpl.name,
            faceValue: tpl.faceValue,
            remainingValue: tpl.faceValue,
            status: 'pending',
            expireTime,
            splitEnabled: tpl.splitEnabled,
            minSplitAmount: tpl.minSplitAmount || 0,
            couponType: tpl.couponType,
            createdAt: now,
          });
        }

        addCoupons(newCoupons);
        setGenerating(false);
        setResult({ success: num, ids });
      }
    }, 400);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/templates')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">批量生成优惠券</h1>
          <p className="text-sm text-slate-500 mt-1">基于模板批量生成指定数量的优惠券</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">所选模板</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-400">模板名称：</span><span className="text-slate-800 font-medium ml-1">{tpl.name}</span></div>
          <div><span className="text-slate-400">面额：</span><span className="text-slate-800 font-semibold ml-1">{formatCurrency(tpl.faceValue)}</span></div>
          <div><span className="text-slate-400">券类型：</span><span className="text-slate-800 ml-1">{tpl.couponType === 'normal' ? '普通券' : tpl.couponType === 'newcomer' ? '新客券' : '活动券'}</span></div>
          <div><span className="text-slate-400">模板 ID：</span><span className="font-mono text-xs text-slate-500 ml-1">{tpl.id}</span></div>
        </div>
      </div>

      {!result && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">生成配置</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">生成数量</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max="10000"
              disabled={generating}
              className="w-full md:w-1/2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            <p className="text-xs text-slate-400">单次最多��成 10,000 张，券生成后状态为「待发放」</p>
          </div>

          {generating && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-brand-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在生成中… {progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-light)]">
            <Button variant="ghost" onClick={() => navigate('/templates')}>取消</Button>
            <Button onClick={handleGenerate} disabled={generating} loading={generating}>
              <Layers className="w-4 h-4" />
              确认生成
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-accent-500" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">生成完成</h3>
              <p className="text-sm text-slate-500">成功生成 {result.success} 张优惠券，状态均为「待发放」</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700">生成信息</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-400">券 ID 前缀：</span><span className="font-mono text-xs text-slate-600">CPN_{tpl.id}_</span></div>
              <div><span className="text-slate-400">初始状态：</span><span className="text-slate-600">待发放</span></div>
              <div><span className="text-slate-400">每张面额：</span><span className="text-slate-600">{formatCurrency(tpl.faceValue)}</span></div>
              <div><span className="text-slate-400">生成张数：</span><span className="text-slate-600">{result.success}</span></div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setResult(null); setProgress(0); }}>
              继续生成
            </Button>
            <Button onClick={() => navigate('/issue')}>
              去发放优惠券
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
