# yespiz

yespiz connects a shared pizza menu with restaurant capacity, checkout and courier handover. The customer, partner and administration portals use the same NestJS API.

## Run locally

Use Node.js 24 or newer and install the workspace dependencies with the package manager version declared in package.json. Copy .env.example to .env.local, set your initial admin email and a password of at least 12 characters, and run from the repository root:

```sh
node --env-file=.env.local scripts/start.mjs
```

| Portal                     | Local address                         |
| -------------------------- | ------------------------------------- |
| Customer and order history | http://127.0.0.1:3200                 |
| Administration             | http://127.0.0.1:3201                 |
| Restaurant                 | http://127.0.0.1:3202                 |
| Courier                    | http://127.0.0.1:3202/courier         |
| API health                 | http://127.0.0.1:3203/platform/health |

The first administrator is created only when no admin account exists. Staff accounts and their restaurant memberships come from Administration. Customers can register in the storefront. The database starts with an empty menu and no restaurant accounts. SQLite data is stored in apps/backend/.yespiz.sqlite. Set YESPIZ_DB to an absolute path on a persistent volume for a hosted instance. Back up that file using a SQLite-aware backup process.

### Rehearse the Vienna pilot locally

```sh
node scripts/start.mjs --pilot
```

This starts a separate cash-only rehearsal on ports 3210–3213 with a fresh temporary SQLite database on each run. The launcher prints the database path. The fixtures include postcode **1010 Wien**, a Margherita, two test restaurants and a courier linked to both. All fixture accounts use `yespiz-local-pilot-only`.

| Role | Portal | Fixture email |
| --- | --- | --- |
| Customer | http://127.0.0.1:3210 | `kunde@pilot.example` |
| Admin | http://127.0.0.1:3211 | `admin@pilot.example` |
| Restaurant | http://127.0.0.1:3212 | `mitte@pilot.example` or `ring@pilot.example` |
| Courier | http://127.0.0.1:3212/courier | `fahrer@pilot.example` |

To rehearse fallback, reject the offer in Mitte, then accept it in Ring before the next offer expires. Confirm cash as the customer, mark the order ready at Ring, hand it over with the pickup code and mark it delivered as the courier. In Ring, save a test receipt reference such as `RING-001` on the delivered order. Check it in customer order history and reconcile the cash in Administration. The automated HTTP test runs the same sequence and publishes the menu and restaurant settings from an empty database first. Run it with `npm run test:e2e --workspace backend`.

## Configure the workflow

1. Add a delivery area with country, region, city and postal code. Configure a travel estimate and activate the area. Prices use EUR.
2. Publish pizzas with prices, prep times and verified allergens. Add each seller's legal name, address, phone and email. Assign the menu and areas it serves, set its capacity and commission, and activate order intake. Enable cash or configure online checkout.
3. Create restaurant and courier accounts. Assign one or more restaurants to each. An offer stays open for 45 seconds, subject to the 135-second search deadline. After reservation, the customer sees the seller and estimated delivery window and confirms the purchase.
4. Prepare the order in the restaurant portal, mark it ready and issue a six-digit pickup code for a specific courier and up to three orders. The courier confirms pickup, delivers and records any cash received. The admin can reconcile cash, record resolutions and close a failed stop.

## External services

### Local integration test

1. Install the [Stripe CLI](https://docs.stripe.com/cli/install) and sign in to the platform Sandbox. In a separate terminal, start the Connect listener and keep it running:

   ```sh
   stripe login
   stripe listen --forward-connect-to http://127.0.0.1:3203/platform/stripe/webhook
   ```

2. Add the platform Sandbox key (`sk_test_…`) as `STRIPE_SECRET_KEY` and the listener signing secret (`whsec_…`) as `STRIPE_WEBHOOK_SECRET` in the root `.env.local`. Keep `YESPIZ_CUSTOMER_URL=http://127.0.0.1:3200`. Set the restaurant's `acct_…` in Administration → Restaurants → Stripe-Konto. Use a connected account in the same Sandbox with card payments enabled.
3. Enable [Routes API](https://developers.google.com/maps/documentation/routes/get-api-key) in a billing-enabled Google Cloud project. Restrict the server-side API key to Routes API and set it as `GOOGLE_ROUTES_KEY` in the same file. Restart yespiz to load the keys.
4. Reserve a customer order and choose **Online zur Zahlung**. Use Stripe's [test card](https://docs.stripe.com/testing#cards) `4242 4242 4242 4242`, a future expiry and any three-digit CVC. Verify the CLI forwards the Checkout event with HTTP 204 and yespiz moves the order to **Bestellung bestätigt**. The return URL alone does not confirm payment.
5. Mark two or three orders for the same restaurant ready. Use nearby addresses with overlapping delivery windows. Issue a pickup PIN, redeem it as the assigned courier, and check the ordered stops. The route planner rejects a batch that cannot meet its delivery windows.

### Integration behavior

- Cash on delivery works without an external provider. The restaurant remains responsible for issuing its receipt. Cash reconciliation records verification of funds and does not transfer them.
- For online payments, configure STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and YESPIZ_CUSTOMER_URL. Configure each seller's Stripe Connect account ID in Administration. Subscribe the Connect webhook at /platform/stripe/webhook to checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed and checkout.session.expired. Online payment uses direct charges and application fees. Stripe Checkout displays Apple Pay and Google Pay where eligible, and Klarna can be enabled per seller after its eligibility is confirmed. Use test-mode credentials first. A signed webhook confirms payment. Unexpected late payments go to admin review for refund.
- Set GOOGLE_ROUTES_KEY for a driving route matrix for two or three stops. The app compares the stop orders against each delivery window and the maximum travel time. Single-order pickup works without a route key. The driver can open navigation for the selected stop.
- Customer order updates stream from the API and fall back to polling if the connection drops. Partner and admin queues refresh automatically. Initial ETA uses the configured travel estimate, order prep times and restaurant backlog.

Use HTTPS for the three public portals and set YESPIZ_API_ORIGIN at Next.js build time to the private API origin. The Nest API binds to loopback by default. Expose the Stripe webhook through your HTTPS ingress. Run Next.js production builds for all three portals and launch the Nest output from apps/backend. Locally, pass --production to the launcher to use existing Next.js production builds.

See founder/product-spec.md for the product requirements and pilot acceptance criteria.
