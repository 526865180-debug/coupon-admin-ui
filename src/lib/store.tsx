import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CouponTemplate, Coupon, IssueRecord } from '../types';
import { mockTemplates as initialTemplates, mockCoupons as initialCoupons, mockIssueRecords as initialRecords } from '../lib/mock-data';

interface StoreContextType {
  templates: CouponTemplate[];
  coupons: Coupon[];
  issueRecords: IssueRecord[];
  addTemplate: (template: CouponTemplate) => void;
  updateTemplate: (id: string, updates: Partial<CouponTemplate>) => void;
  addCoupons: (coupons: Coupon[]) => void;
  issueCoupons: (couponIds: string[], merchantId: string, merchantName: string, channel: 'manual' | 'auto' | 'campaign', operator: string) => { success: number; skip: number; reasons: string[] };
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  freezeCoupon: (id: string, reason: string) => void;
  unfreezeCoupon: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<CouponTemplate[]>(initialTemplates);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [issueRecords, setIssueRecords] = useState<IssueRecord[]>(initialRecords);

  const addTemplate = useCallback((template: CouponTemplate) => {
    setTemplates((prev) => [template, ...prev]);
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<CouponTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const addCoupons = useCallback((newCoupons: Coupon[]) => {
    setCoupons((prev) => [...newCoupons, ...prev]);
  }, []);

  const updateCoupon = useCallback((id: string, updates: Partial<Coupon>) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const freezeCoupon = useCallback((id: string, reason: string) => {
    const now = new Date().toISOString();
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'frozen' as const, frozenAt: now, frozenReason: reason, previousStatus: c.status }
          : c,
      ),
    );
  }, []);

  const unfreezeCoupon = useCallback((id: string) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const restoreStatus = (c as Coupon & { previousStatus?: Coupon['status'] }).previousStatus || 'issued';
        return {
          ...c,
          status: restoreStatus,
          frozenAt: undefined,
          frozenReason: undefined,
        };
      }),
    );
  }, []);

  const issueCoupons = useCallback((
    couponIds: string[],
    merchantId: string,
    merchantName: string,
    channel: 'manual' | 'auto' | 'campaign',
    operator: string,
  ) => {
    const now = new Date().toISOString();
    let success = 0;
    let skip = 0;
    const reasons: string[] = [];

    setCoupons((prev) => {
      const updated = prev.map((c) => {
        if (!couponIds.includes(c.id)) return c;
        // Check if coupon can be issued
        if (c.status !== 'pending') {
          skip++;
          reasons.push(`${c.couponId}: 状态为「${c.status}」，不可发放`);
          return c;
        }
        // Check holding limit (same type, same merchant, count < 50)
        const sameTypeCount = prev.filter(
          (x) => x.merchantId === merchantId && x.couponType === c.couponType &&
            (x.status === 'issued' || x.status === 'part_used' || x.status === 'frozen'),
        ).length;
        if (sameTypeCount >= 50) {
          skip++;
          reasons.push(`${merchantName}(${merchantId}): 同类型券已达持有上限 50 张`);
          return c;
        }

        success++;
        return {
          ...c,
          status: 'issued' as const,
          merchantId,
          merchantName,
          issuedAt: now,
          issuedChannel: channel,
        };
      });
      return updated;
    });

    // Generate issue records
    const records: IssueRecord[] = couponIds.map((cid, i) => {
      const c = coupons.find((x) => x.id === cid);
      const isSkipped = reasons.some((r) => r.startsWith(c?.couponId || ''));
      return {
        id: `IR_${Date.now()}_${i}`,
        couponId: c?.couponId || cid,
        merchantId,
        merchantName,
        channel,
        operator,
        result: isSkipped ? 'fail' as const : 'success' as const,
        failReason: isSkipped ? reasons.find((r) => r.startsWith(c?.couponId || '')) : undefined,
        createdAt: now,
      };
    });
    setIssueRecords((prev) => [...records, ...prev]);

    return { success, skip, reasons };
  }, [coupons]);

  return (
    <StoreContext.Provider value={{ templates, coupons, issueRecords, addTemplate, updateTemplate, addCoupons, issueCoupons, updateCoupon, freezeCoupon, unfreezeCoupon }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
