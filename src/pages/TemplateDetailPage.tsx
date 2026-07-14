import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { useStore } from '../lib/store';
import { formatCurrency, formatDateShort } from '../lib/utils';
import { BIZ_SCENE_MAP } from '../types';

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { templates } = useStore();
  const navigate = useNavigate();
  const tpl = templates.find((t) => t.id === id);

  if (!tpl) {
    return (
      <div className="animate-fade-in text-center py-20">
        <p className="text-slate-400">模板不存在</p>
        <Button variant="ghost" onClick={() => navigate('/templates')} className="mt-4">返回列表</Button>
      </div>
    );
  }

  const typeMap: Record<string, string> = { normal: '普通券', newcomer: '新客券', campaign: '活动券' };
  const scopeMap: Record<string, string> = { all: '全部商户', specific: '指定商户', group: '指定分组', tag: '指定标签' };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/templates')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{tpl.name}</h1>
          <p className="text-sm text-slate-500 mt-1">模板 ID：{tpl.id}</p>
        </div>
        <div className="flex gap-2">
          {tpl.status === 'active' && (
            <Button onClick={() => navigate(`/templates/${tpl.id}/generate`)}>
              <Layers className="w-4 h-4" />
              批量生成券
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/templates/new?copy=${tpl.id}`)}>
            <Edit className="w-4 h-4" />
            编辑
          </Button>
        </div>
      </div>

      {/* Basic Info Card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">基础信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="模板名称" value={tpl.name} />
          <InfoItem label="面额" value={formatCurrency(tpl.faceValue)} />
          <InfoItem label="券类型" value={typeMap[tpl.couponType]} />
          <InfoItem label="状态">
            <StatusBadge status={tpl.status} label={tpl.status === 'active' ? '启用' : '停用'} />
          </InfoItem>
          <InfoItem label="适用商户范围" value={scopeMap[tpl.merchantScopeType]} />
          <InfoItem label="适用业务场景" value={tpl.bizScenes.map((s) => BIZ_SCENE_MAP[s]).join('、')} />
          <InfoItem label="单笔抵扣上限" value={tpl.deductionLimit ? formatCurrency(tpl.deductionLimit) : '不限制'} />
        </div>
      </div>

      {/* Validity Card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">有效期设置</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label="有效期类型" value={tpl.expireType === 'fixed' ? '固定日期' : '相对天数'} />
          {tpl.expireType === 'fixed' ? (
            <>
              <InfoItem label="开始日期" value={formatDateShort(tpl.expireStart!)} />
              <InfoItem label="结束日期" value={formatDateShort(tpl.expireEnd!)} />
            </>
          ) : (
            <InfoItem label="有效天数" value={`${tpl.validDays} 天（自发放日起算）`} />
          )}
        </div>
      </div>

      {/* Split Card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">拆分设置</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label="启用拆分" value={tpl.splitEnabled ? '是' : '否'} />
          {tpl.splitEnabled && (
            <InfoItem label="最小拆分抵扣金额" value={formatCurrency(tpl.minSplitAmount!)} />
          )}
        </div>
      </div>

      {/* Meta Card */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">操作记录</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="创建人" value={tpl.createdBy} />
          <InfoItem label="创建时间" value={formatDateShort(tpl.createdAt)} />
          <InfoItem label="最后修改时间" value={formatDateShort(tpl.updatedAt)} />
        </div>
      </div>

      {tpl.remark && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">备注</h2>
          <p className="text-sm text-slate-600">{tpl.remark}</p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {value !== undefined ? <p className="text-sm text-slate-800 font-medium">{value}</p> : children}
    </div>
  );
}
