export interface CouponTemplate {
  id: string;
  name: string;
  faceValue: number;
  expireType: 'fixed' | 'relative';
  expireStart?: string;
  expireEnd?: string;
  validDays?: number;
  bizScenes: ('payment' | 'collection' | 'fx_settlement')[];
  merchantScopeType: 'all' | 'specific' | 'group' | 'tag';
  deductionLimit?: number;
  splitEnabled: boolean;
  minSplitAmount?: number;
  couponType: 'normal' | 'newcomer' | 'campaign';
  status: 'active' | 'inactive';
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CouponStatus = 'pending' | 'issued' | 'part_used' | 'fully_used' | 'expired' | 'frozen' | 'deleted';

export interface Coupon {
  id: string;
  couponId: string;
  rightsCode: string;
  templateId: string;
  templateName: string;
  merchantId?: string;
  merchantName?: string;
  faceValue: number;
  remainingValue: number;
  status: CouponStatus;
  expireTime: string;
  splitEnabled: boolean;
  minSplitAmount: number;
  couponType: 'normal' | 'newcomer' | 'campaign';
  issuedAt?: string;
  issuedChannel?: string;
  frozenAt?: string;
  frozenReason?: string;
  previousStatus?: CouponStatus;
  createdAt: string;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  txnId: string;
  deductAmount: number;
  remainingBefore: number;
  remainingAfter: number;
  createdAt: string;
}

export interface IssueRecord {
  id: string;
  couponId: string;
  merchantId: string;
  merchantName: string;
  channel: 'manual' | 'auto' | 'campaign';
  operator: string;
  result: 'success' | 'fail';
  failReason?: string;
  createdAt: string;
}

export interface StatsOverview {
  totalIssued: number;
  totalFaceValue: number;
  redemptionRate: number;
  totalDeducted: number;
  splitUsageRatio: number;
  expiredAmount: number;
  frozenCount: number;
}

export interface RiskEvent {
  id: string;
  merchantId: string;
  merchantName: string;
  ruleName: string;
  eventType: 'block' | 'warning';
  description: string;
  createdAt: string;
}

export const COUPON_STATUS_MAP: Record<CouponStatus, string> = {
  pending: '待发放',
  issued: '已发放',
  part_used: '部分核销',
  fully_used: '全额核销',
  expired: '过期作废',
  frozen: '冻结',
  deleted: '已删除',
};

export const COUPON_STATUS_COLOR: Record<CouponStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  issued: 'bg-brand-100 text-brand-700',
  part_used: 'bg-accent-100 text-accent-700',
  fully_used: 'bg-slate-100 text-slate-500',
  expired: 'bg-red-50 text-red-600',
  frozen: 'bg-amber-50 text-amber-700',
  deleted: 'bg-slate-100 text-slate-400',
};

export const COUPON_TYPE_MAP: Record<string, string> = {
  normal: '普通券',
  newcomer: '新客券',
  campaign: '活动券',
};

export const BIZ_SCENE_MAP: Record<string, string> = {
  payment: '付款',
  collection: '收款',
  fx_settlement: '结汇',
};
