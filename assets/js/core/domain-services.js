/**
 * ============================================================================
 * DOMAIN-SERVICES.JS — Domain Services Layer (DDD Aggregates & Business Logic)
 * Standard: Clean Architecture · DDD Bounded Contexts · Pure Business Rules
 * Domains: Commercial · Supply Chain · Engineering · Finance
 * ============================================================================
 */

(function(window) {
  'use strict';

  // ==========================================================================
  // 1. COMMERCIAL DOMAIN SERVICE (Subcontracts, Tenders, Contractors)
  // ==========================================================================

  class CommercialDomainService {
    static calculateSubcontractFinancials(subcontract) {
      const orig = Number(subcontract.original_value || 0);
      const vos = Number(subcontract.approved_vos || 0);
      const totalCommitment = orig + vos;
      const measured = Number(subcontract.executed_measured || 0);
      const retentionPct = Number(subcontract.retention_pct || 10.0);
      const retentionVal = measured * (retentionPct / 100);
      const netPayable = measured - retentionVal;
      const netPaid = Number(subcontract.net_paid || netPayable);
      const balanceToDisburse = netPayable - netPaid;
      const completionPct = totalCommitment > 0 ? (measured / totalCommitment) * 100 : 0;

      return {
        totalCommitment: Number(totalCommitment.toFixed(2)),
        measured: Number(measured.toFixed(2)),
        retentionVal: Number(retentionVal.toFixed(2)),
        netPayable: Number(netPayable.toFixed(2)),
        netPaid: Number(netPaid.toFixed(2)),
        balanceToDisburse: Number(balanceToDisburse.toFixed(2)),
        completionPct: Number(completionPct.toFixed(1)),
        isOverbilled: measured > totalCommitment
      };
    }

    static evaluateTenderPackage(tenderPackage) {
      if (window.SubcontractTenderEngine) {
        return window.SubcontractTenderEngine.evaluateBids(tenderPackage);
      }
      return null;
    }
  }

  // ==========================================================================
  // 2. SUPPLY CHAIN DOMAIN SERVICE (Catalog, Comparison, UNSPSC)
  // ==========================================================================

  class SupplyChainDomainService {
    static calculatePriceComparison(item) {
      const prices = [
        Number(item.price_sup1 || 0),
        Number(item.price_sup2 || 0),
        Number(item.price_sup3 || 0),
        Number(item.price_sup4 || 0)
      ].filter(p => p > 0);

      if (!prices.length) return null;

      const sorted = [...prices].sort((a, b) => a - b);
      const minPrice = sorted[0];
      const secondMinPrice = sorted[1] || sorted[0];
      const maxPrice = sorted[sorted.length - 1];
      const priceDiff = maxPrice - minPrice;
      const savingsPct = maxPrice > 0 ? (priceDiff / maxPrice) * 100 : 0;

      return {
        minPrice,
        secondMinPrice,
        maxPrice,
        priceDiff: Number(priceDiff.toFixed(2)),
        savingsPct: Number(savingsPct.toFixed(2))
      };
    }

    static lookupUNSPSC(code) {
      if (window.ProcurementUNSPSC) {
        return window.ProcurementUNSPSC.lookupUNSPSC(code);
      }
      return { title_ar: 'تصنيف عام', division: '01 00 00', sbc: 'SBC 201' };
    }
  }

  // ==========================================================================
  // 3. ENGINEERING DOMAIN SERVICE (BBS, Clash Impact, Takeoff)
  // ==========================================================================

  class EngineeringDomainService {
    static calculateRebarWeight(diameterMm, lengthM) {
      if (window.RebarEngine) {
        const unitWeight = window.RebarEngine.calculateRebarUnitWeight(diameterMm);
        return unitWeight * lengthM;
      }
      const unitWeight = (diameterMm * diameterMm) / 162.0;
      return unitWeight * lengthM;
    }

    static calculateClashCostImpact(severity, trade1, trade2) {
      if (window.ClashCostEngine) {
        return window.ClashCostEngine.calculateClashCostImpact(severity, trade1, trade2);
      }
      return { totalHours: 10, totalCostSar: 2400 };
    }
  }

  // ==========================================================================
  // 4. FINANCE DOMAIN SERVICE (EVM, ZATCA, Billing)
  // ==========================================================================

  class FinanceDomainService {
    static computeFullEVM(bac, pv, ev, ac) {
      if (window.FullEvmEngine) {
        return window.FullEvmEngine.computeFullEVMKernel(bac, pv, ev, ac);
      }
      return null;
    }

    static generateZatcaQR(seller, vatNum, timestamp, total, vat) {
      if (window.ZatcaEngine) {
        return window.ZatcaEngine.generateZatcaTLV(seller, vatNum, timestamp, total, vat);
      }
      return '';
    }
  }

  // ==========================================================================
  // EXPORT TO GLOBAL WINDOW
  // ==========================================================================

  window.CommercialDomainService = CommercialDomainService;
  window.SupplyChainDomainService = SupplyChainDomainService;
  window.EngineeringDomainService = EngineeringDomainService;
  window.FinanceDomainService = FinanceDomainService;

})(window);
