/**
 * Inline evidence seeds for photo → CUSTOMER_DATA_BLOCK pipeline tests.
 * Mirrors e2e-live/fixtures/seed-cases.ts narratives + derived photo captions
 * (what vision would return). No binary media required.
 */

// 1×1 PNG for API upload tests (not used by pure prompt tests)
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const EVIDENCE_SEEDS = {
  'auto-p0301-misfire': {
    id: 'auto-p0301-misfire',
    payload: {
      equipmentType: 'automotive',
      make: 'Toyota',
      model: 'Camry',
      year: '2020',
      mileageHours: '84500',
      errorCodes: 'P0301',
      problemDescription:
        'Check engine light with rough idle and a single-cylinder misfire under load. ' +
        'Scanner shows P0301 (cylinder 1 misfire). Started two weeks ago after a rainy week; ' +
        'worse on cold mornings and when climbing hills. No recent spark plug service. ' +
        'Independent shop quoted $1,850 for coils + plugs + possible injector — want a second opinion ' +
        'before authorizing parts.',
      symptoms: 'rough idle, misfire under load, cold mornings worse',
      previousRepairs: 'Oil change only; no ignition work in last 40k miles.',
      shopQuoteAmount: '1850',
      shopRecommendation: 'Replace all coils and plugs; inspect injector if misfire continues.',
      troubleshootingSteps: 'Cleared codes once; P0301 returned within 12 miles. No vacuum leak spray test yet.',
      fullName: 'Alex Rivera',
      email: 'playwright.misfire@example.com',
      phone: '4045550142'
    },
    photoItems: [
      {
        label: 'dash / scan tool',
        caption:
          'Instrument cluster shows steady MIL. OBD scan list highlights P0301 cylinder 1 misfire.',
        ocr_text: 'P0301'
      },
      {
        label: 'engine bay coil bank',
        caption:
          'Coil-on-plug assembly on cylinder bank; no heavy oil flooding visible in wells from this angle.',
        ocr_text: null
      }
    ],
    expectInPrompt: ['P0301', 'PHOTO EVIDENCE', 'misfire', 'coil']
  },

  'diesel-nox-derate': {
    id: 'diesel-nox-derate',
    payload: {
      equipmentType: 'semi-trucks',
      make: 'Kenworth',
      model: 'T680',
      year: '2017',
      mileageHours: '612000',
      errorCodes: 'SPN 3216 FMI 4',
      problemDescription:
        'Power derate to ~5 mph after ~20 minutes at highway speed. Dash shows aftertreatment fault. ' +
        'Shop scan: SPN 3216 FMI 4 (aftertreatment 1 outlet NOx sensor). Regen attempts fail mid-cycle. ' +
        'Truck is out of service — need root cause vs throw-parts path. DEF quality recently topped off ' +
        'from a bulk tote that may have been contaminated.',
      symptoms: 'derate after highway run, aftertreatment fault, failed regen',
      previousRepairs: 'DOC/DPF service 40k miles ago; NOx sensor not replaced.',
      shopQuoteAmount: '2400',
      shopRecommendation: 'Replace outlet NOx sensor and reflash ACM; possible harness open.',
      troubleshootingSteps: 'Forced parked regen aborted at 38%. Visual harness check OK at first glance.',
      fullName: 'Jordan Blake',
      email: 'playwright.derate@example.com',
      phone: '7065550198'
    },
    photoItems: [
      {
        label: 'dash aftertreatment',
        caption:
          'Driver display shows aftertreatment/DEF related fault; derate messaging visible.',
        ocr_text: 'SPN 3216'
      }
    ],
    expectInPrompt: ['PHOTO EVIDENCE', 'NOx', '3216', 'derate']
  },

  'hvac-hard-start': {
    id: 'hvac-hard-start',
    payload: {
      equipmentType: 'hvac',
      make: 'Trane',
      model: 'XR15 (Central AC)',
      year: '2015',
      mileageHours: '11 seasons',
      errorCodes: 'none displayed',
      problemDescription:
        'Trane XR15 outdoor unit hard-starts then trips the 40A double-pole breaker after ~8 minutes of run time. ' +
        'Cooling weak upstairs. Capacitor was replaced last season. Tech quoted full compressor replacement ' +
        'at $3,200 parts+labor. Want to know if start-assist, contactor, or low refrigerant is more likely ' +
        'before committing to a compressor.',
      symptoms: 'hard start, breaker trip after ~8 minutes, weak cooling upstairs',
      previousRepairs: 'Dual-run capacitor replaced 14 months ago; filter changes every 60 days.',
      shopQuoteAmount: '3200',
      shopRecommendation: 'Replace compressor and drier; reclaim/recharge R-410A.',
      troubleshootingSteps: 'Breaker holds if unit is left off 45+ minutes; immediate restart trips sooner.',
      fullName: 'Jeremy Longshore',
      email: 'jeremy@intentsolutions.io'
    },
    photoItems: [
      {
        label: 'outdoor unit data plate',
        caption:
          'Condensing unit nameplate readable as Trane XR15 family; dual-run capacitor area visible.',
        ocr_text: 'XR15'
      },
      {
        label: 'breaker panel',
        caption:
          '40A double-pole breaker for outdoor unit; no scorch marks visible on this photo.',
        ocr_text: '40'
      }
    ],
    expectInPrompt: ['PHOTO EVIDENCE', 'XR15', 'breaker', 'capacitor']
  }
};

module.exports = {
  EVIDENCE_SEEDS,
  TINY_PNG_BASE64,
  tinyPngBuffer() {
    return Buffer.from(TINY_PNG_BASE64, 'base64');
  }
};
