/**
 * Valuable mock seed cases for live Playwright journeys.
 *
 * Each case is designed to stress the 15-section AI report path:
 * - real-looking DTCs / SPNs
 * - shop quote pressure (price-negotiation sections)
 * - multi-symptom + environment context
 * - prior repairs / modifications (differential diagnosis)
 *
 * Use with test.diagnosticpro.io + Stripe TEST keys + coupon TEST1001.
 */

export type SeedCase = {
  id: string;
  label: string;
  /** equipment landing slug for /equipment/:slug */
  equipmentSlug: string;
  make: string;
  model: string;
  year: string;
  /** Primary problem narrative (form #description) */
  description: string;
  mileage: string;
  errorCodes: string;
  fullName: string;
  /** base local-part; tests append +epoch for uniqueness */
  emailLocal: string;
  phone?: string;
  /** Extra fields filled when "Add Details" is open */
  details?: {
    previousRepairs?: string;
    shopQuoteAmount?: string;
    shopRecommendation?: string;
    troubleshootingSteps?: string;
  };
  /** What the report should reasonably surface (soft assertions / evidence only) */
  expectHints: string[];
};

export const SEED_CASES: SeedCase[] = [
  {
    id: 'auto-p0301-misfire',
    label: 'Automotive single-cylinder misfire with shop quote pressure',
    equipmentSlug: 'automotive',
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    description:
      'Check engine light with rough idle and a single-cylinder misfire under load. ' +
      'Scanner shows P0301 (cylinder 1 misfire). Started two weeks ago after a rainy week; ' +
      'worse on cold mornings and when climbing hills. No recent spark plug service. ' +
      'Independent shop quoted $1,850 for coils + plugs + possible injector — want a second opinion ' +
      'before authorizing parts.',
    mileage: '84500',
    errorCodes: 'P0301',
    fullName: 'Alex Rivera',
    emailLocal: 'playwright.misfire',
    phone: '4045550142',
    details: {
      previousRepairs: 'Oil change only; no ignition work in last 40k miles.',
      shopQuoteAmount: '1850',
      shopRecommendation: 'Replace all coils and plugs; inspect injector if misfire continues.',
      troubleshootingSteps: 'Cleared codes once; P0301 returned within 12 miles. No vacuum leak spray test yet.',
    },
    expectHints: ['P0301', 'misfire', 'coil', 'spark'],
  },
  {
    id: 'diesel-nox-derate',
    label: 'Class-8 truck NOx sensor derate with emissions pressure',
    equipmentSlug: 'semi-trucks',
    make: 'Kenworth',
    model: 'T680',
    year: '2017',
    description:
      'Power derate to ~5 mph after ~20 minutes at highway speed. Dash shows aftertreatment fault. ' +
      'Shop scan: SPN 3216 FMI 4 (aftertreatment 1 outlet NOx sensor). Regen attempts fail mid-cycle. ' +
      'Truck is out of service — need root cause vs throw-parts path. DEF quality recently topped off ' +
      'from a bulk tote that may have been contaminated.',
    mileage: '612000',
    errorCodes: 'SPN 3216 FMI 4',
    fullName: 'Jordan Blake',
    emailLocal: 'playwright.derate',
    phone: '7065550198',
    details: {
      previousRepairs: 'DOC/DPF service 40k miles ago; NOx sensor not replaced.',
      shopQuoteAmount: '2400',
      shopRecommendation: 'Replace outlet NOx sensor and reflash ACM; possible harness open.',
      troubleshootingSteps: 'Forced parked regen aborted at 38%. Visual harness check OK at first glance.',
    },
    expectHints: ['NOx', 'derate', 'aftertreatment', '3216'],
  },
  {
    id: 'hvac-hard-start',
    label: 'Residential HVAC compressor hard-start / breaker trip',
    equipmentSlug: 'hvac',
    make: 'Trane',
    model: 'XR16',
    year: '2015',
    description:
      'Outdoor unit hard-starts then trips the 40A double-pole breaker after ~8 minutes of run time. ' +
      'Cooling weak upstairs. Capacitor was replaced last season. Tech quoted full compressor replacement ' +
      'at $3,200 parts+labor. Want to know if start-assist, contactor, or low refrigerant is more likely ' +
      'before committing to a compressor.',
    mileage: '11 seasons',
    errorCodes: 'none displayed',
    fullName: 'Sam Okonkwo',
    emailLocal: 'playwright.hvac',
    details: {
      previousRepairs: 'Dual-run capacitor replaced 14 months ago; filter changes every 60 days.',
      shopQuoteAmount: '3200',
      shopRecommendation: 'Replace compressor and drier; reclaim/recharge R-410A.',
      troubleshootingSteps: 'Breaker holds if unit is left off 45+ minutes; immediate restart trips sooner.',
    },
    expectHints: ['compressor', 'capacitor', 'breaker', 'hard start'],
  },
];

/** Default case for the free-coupon full journey (richest negotiation signal). */
export const DEFAULT_SEED = SEED_CASES[0];
