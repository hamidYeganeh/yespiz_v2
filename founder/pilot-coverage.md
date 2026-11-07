# Vienna pilot coverage

The identifiers refer to the rebuild brief. Each row records the current entry point, the persisted effect or access rule, and the acceptance scenario that must prove it. “Partial” means the implementation has gaps or lacks full verification. Run all acceptance scenarios against isolated pilot data.

| Flow | Current UI and API | Data and access | Acceptance and open work |
| --- | --- | --- | --- |
| C01 | Storefront and `GET /platform/catalog` | Enabled zones and kitchen coverage | E04. Partial. Validate full address, overlap priority and shift availability before checkout. |
| C02 | Storefront cart and `POST /platform/orders` | Catalog version and server-calculated subtotal | E04. Partial. Add options, version approval and a revised quote confirmation. |
| C03 | Storefront checkout and order history show active search time and offer a retry after exhaustion | Customer ownership, request fingerprint and one retry per exhausted request | E02, E03, E07. Partial. Browser reload, reconnect and retry still need acceptance coverage. |
| C04 | Reserved order checkout | Reservation seller snapshot, ETA and expiry | E04. Partial. Capture the confirmed terms and handle seller changes and renewed confirmation. |
| C05 | Cash and Stripe actions in checkout | Payment method and provider session | E03, E06. Partial. Verify browser return and recovery from a lost response. |
| C06 | Order history, SSE and support | Scoped order snapshots, timeline, restaurant receipt reference and incidents | E01, E07, E08. Partial. Add replayable versions, delay reasons and support resolution. |
| R01 | Restaurant portal and availability API | Restaurant membership and intake flag | E01, E08. Partial. Add shift schedule, ready checks and courier capacity controls. |
| R02 | Admin menu assignment | Kitchen pizza IDs | E04. Partial. Add restaurant approval of an effective menu version and its local availability. |
| R03 | Restaurant offers and response API | Attempt deadline, eligibility and conditional reservation | E02, E03. Partial. Persist decline reasons and verify simultaneous actions across processes. |
| R04 | Restaurant queue and status API | Confirmed → preparing → ready | E01, E06. Partial. Add package identifiers and handoff checklist. |
| R05 | Restaurant pickup action | Code scoped to restaurant, courier and up to three orders | E05. Partial. Add QR, pre-handoff review and explicit revocation. |
| D01 | `/courier` and courier board | Staff login and restaurant memberships | E05, E07. Partial. Add scoped restaurant check-in and QR scanning. |
| D02 | Courier pickup API | PIN expiry, attempt cap and atomic pickup | E05. Partial. Add package preview and confirmation in the courier UI. |
| D03 | Courier board and delivery action | One active trip, assigned stops and cash confirmation | E01, E05. Partial. Persist start, arrival, evidence and exact cash received per stop. |
| D04 | Courier incident form and admin resolution | Incidents attached to assigned orders | E08. Partial. Add operation instructions and audited reassignment. |
| A01 | Admin zone settings | Flat enabled zone records | E01, E04. Partial. Add geography hierarchy, activation rules and time windows. |
| A02 | Admin menu settings | Current menu and order line snapshots | E01, E04. Partial. Add publishable versions, effective dates and approval history. |
| A03 | Admin settings and staff panel | Legal seller fields, payment flags, memberships and access changes | E07. Partial. Add contract versions and activation rules. Staff access changes revoke sessions and pending pickups. |
| A04 | Admin operations and intake controls | Recent orders and current restaurant flags | E02, E08. Partial. Add versioned ranking weights, scoped pause and offline alerts. |
| A05 | Admin incident, failed stop and refund actions | Order, incident and audit records | E06, E08. Partial. Add assignment, customer replies, replacement and partial refund. |
| A06 | Admin cash reconciliation and audit list | Settlement timestamp, restaurant receipt reference and audit entries | E01, E08. Partial. Add cash variance, second review and report export. |

| Gate | Existing evidence | Remaining proof |
| --- | --- | --- |
| E01 | The local `--pilot` launcher creates isolated Vienna fixtures. The HTTP acceptance test publishes settings and creates role accounts, then checks first-kitchen rejection, second-kitchen reservation, cash confirmation, preparation, pickup, delivery, scoped receipt capture and reconciliation. | Browser UI setup and complete browser cash loop. |
| E02 | Backend tests cover acceptance just before expiry, rejection at expiry, late-offer cutoff, the three-attempt and 135-second caps, file-backed restart and a single authorized retry per exhausted request. | Browser search timer, exhausted state and retry. |
| E03 | Order creation deduplicates matching fingerprints in a transaction. | Concurrent final capacity, accept versus cancel, retry after a lost response and payment duplication. |
| E04 | Order stores line snapshots and rejects stale catalog versions. | Quote revision, partner approvals, address coverage, seller change and reservation expiry in browser. |
| E05 | Backend tests cover designated courier, cash handoff and a route that fails deadline checks. | QR and manual entry, invalid and reused codes, 1–3 stops, fourth order, active trip guard and degraded routing. |
| E06 | Backend tests exercise invalid and duplicate Stripe webhook events and checkout retry. | Refund variants, late and async outcomes, browser return and authorized Sandbox checkout and webhook. |
| E07 | Staff HTTP test covers admin authorization, suspension, reactivation, membership, role change and stale session rejection. | Cross-account order and event isolation, cross-restaurant and trip authorization, reconnect ordering and polling. |
| E08 | Admin APIs support incidents, failed stops and cash settlement. | End-of-shift browser exercise, discrepancy and second review, history and report export. |
| E09 | Backend and admin TypeScript checks pass with the installed compiler. | Versioned upgrade and restore rehearsal, all workspace type checks, lint and production builds. The admin ESLint config currently loads TypeScript 7, which its parser rejects. |
| E10 | Backend integration tests use isolated SQLite fixtures. | Automated browser acceptance for all roles and a separate record of provider Sandbox verification. |
