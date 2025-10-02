import { TRouterXcmFeeResult } from "@paraspell/xcm-router";
import { formatAmount } from '@/services/balances/utils';
import { NUMBER_FORMAT_OPTIONS } from '@/services/constants';

export type FeeDetail = {
  rawAmount: string;
  adjustedAmount: string;
  decimals: number;
  currency: string;
};

export type FeeSummary = {
  totalFees: {
    [currency: string]: FeeDetail;
  };
  breakdown: {
    origin: TRouterXcmFeeResult['origin'];
    destination: TRouterXcmFeeResult['destination'];
    hops: TRouterXcmFeeResult['hops'];
  };
};

export type FeeEstimate = {
  fees: FeeSummary | null;
  isLoading: boolean;
  error?: string;
};

/**
 * Safe JSON serialization that handles BigInt values
 */
export const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

/**
 * Calculates total fees from RouterBuilder fee result
 * Aggregates fees by currency and converts to human-readable format
 */
export const calculateTotalFees = (feeResult: TRouterXcmFeeResult): FeeSummary => {
  const feeMap = new Map<string, { raw: bigint; decimals: number }>();
  
  // Process origin fees
  const originFee = BigInt(feeResult.origin.fee || "0");
  const originDecimals = feeResult.origin.asset?.decimals || 0;
  feeMap.set(feeResult.origin.currency, { raw: originFee, decimals: originDecimals });
  
  // Process destination fees
  const destFee = BigInt(feeResult.destination.fee || "0");
  const destDecimals = feeResult.destination.asset?.decimals || 0;
  const existingDest = feeMap.get(feeResult.destination.currency);
  if (existingDest) {
    feeMap.set(feeResult.destination.currency, { 
      raw: existingDest.raw + destFee, 
      decimals: existingDest.decimals 
    });
  } else {
    feeMap.set(feeResult.destination.currency, { raw: destFee, decimals: destDecimals });
  }
  
  // Process hops fees
  feeResult.hops.forEach(hop => {
    const hopFee = BigInt(hop.result.fee || "0");
    const hopDecimals = hop.result.asset?.decimals || 0;
    const existingHop = feeMap.get(hop.result.currency);
    if (existingHop) {
      feeMap.set(hop.result.currency, { 
        raw: existingHop.raw + hopFee, 
        decimals: existingHop.decimals 
      });
    } else {
      feeMap.set(hop.result.currency, { raw: hopFee, decimals: hopDecimals });
    }
  });
  
  return {
    totalFees: Object.fromEntries(
      Array.from(feeMap.entries()).map(([currency, { raw, decimals }]) => {
        const { decimal: adjustedAmount } = formatAmount(raw, decimals, NUMBER_FORMAT_OPTIONS);
        return [
          currency,
          {
            rawAmount: raw.toString(),
            adjustedAmount,
            decimals,
            currency
          }
        ];
      })
    ),
    breakdown: {
      origin: feeResult.origin,
      destination: feeResult.destination,
      hops: feeResult.hops
    }
  };
};

/**
 * Formats fee summary for display
 */
export const formatFeeSummary = (feeSummary: FeeSummary): string => {
  return Object.entries(feeSummary.totalFees)
    .map(([currency, { adjustedAmount }]) => `${adjustedAmount} ${currency}`)
    .join(' + ');
};

/**
 * Gets adjusted fee amount for a specific fee value and decimals
 */
export const getAdjustedFeeAmount = (fee: string | bigint | undefined, decimals: number): string => {
  if (!fee) return "0";
  const { decimal } = formatAmount(fee, decimals, NUMBER_FORMAT_OPTIONS);
  return decimal;
};
