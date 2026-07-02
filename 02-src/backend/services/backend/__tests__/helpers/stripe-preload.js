// Preload for child-process route tests (node --require this file index.js).
// Replaces the `stripe` module with a deterministic in-memory fake so the
// /createCheckoutSession + /checkout/session success paths can be exercised
// over HTTP without touching api.stripe.com and without modifying index.js.
// NOT a jest file — plain node, loaded via spawn(['--require', ...]).

const Module = require('module');

const sessions = new Map();
let sessionCounter = 0;

function fakeStripeFactory(_secretKey) {
  return {
    checkout: {
      sessions: {
        create: async (opts) => {
          sessionCounter += 1;
          const id = `cs_test_fake${String(sessionCounter).padStart(6, '0')}`;
          const amountTotal = (opts.line_items || []).reduce(
            (sum, li) => sum + (li.price_data?.unit_amount || 0) * (li.quantity || 1),
            0
          );
          const session = {
            id,
            url: `https://checkout.stripe.com/c/pay/${id}`,
            status: 'open',
            payment_status: 'unpaid',
            mode: opts.mode,
            amount_total: amountTotal,
            client_reference_id: opts.client_reference_id || null,
            metadata: opts.metadata || {},
            customer_details: null
          };
          sessions.set(id, session);
          return session;
        },
        retrieve: async (id) => {
          const session = sessions.get(id);
          if (!session) {
            const err = new Error(`No such checkout.session: '${id}'`);
            err.statusCode = 404;
            throw err;
          }
          return session;
        }
      }
    },
    webhooks: {
      constructEvent: () => {
        throw new Error('constructEvent not supported by stripe-preload fake');
      }
    }
  };
}

const originalRequire = Module.prototype.require;
Module.prototype.require = function patchedRequire(id) {
  if (id === 'stripe') {
    return fakeStripeFactory;
  }
  return originalRequire.apply(this, arguments);
};
