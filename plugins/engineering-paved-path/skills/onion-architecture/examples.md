# onion-architecture — worked examples

The pairs below are illustrative, in TypeScript, over a neutral orders
domain. The "good" column is the shape to copy; the "bad" column is either the
kind of code a repo records as accepted debt (marked **debt**) or a plausible
mistake. The shapes carry over to any stack; only the names change.

---

## 1. A route handler

### Good — `modules/orders/routes.ts`

```ts
export default async function ordersRoutes(appBase: FastifyInstance) {
  const app = appBase.withTypeProvider<ZodTypeProvider>();
  const service = new OrdersService(app.container);

  app.get('/orders', async (req) => {
    const { accountId } = await getContext(app.container, req);
    return service.list(accountId);
  });

  app.get('/orders/:id', { schema: { params: IdParams } }, async (req) => {
    const { accountId } = await getContext(app.container, req);
    const order = await service.get(accountId, req.params.id);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  });
}
```

Why it is right: params validated by a schema at the edge; one service call
per handler; the failure is a domain error that the central error handler
renders into the API's error envelope. The handler knows no table names.
(`thin-handlers`, `validate-at-the-edge`, `errors-through-handler`)

### Bad (**debt**) — `modules/billing/routes.ts`

```ts
import { and, count, desc, eq, inArray, isNull, sum } from 'drizzle-orm';
import * as t from '../../db/schema.js';

// …inside the handler:
const lines    = await container.db.select().from(t.invoiceLines).where(eq(t.invoiceLines.invoiceId, inv.id));
const payments = await container.db.select().from(t.payments).where(eq(t.payments.invoiceId, inv.id));
```

Three rings collapsed into one file. The HTTP layer now owns the query plan, so
the read model cannot be tested without a live HTTP request, and reusing
"load an invoice with its lines and payments" anywhere else means copying SQL.
(`sql-in-routes`, `orm-only-in-repository`)

Target shape: `BillingRepository.findInvoiceDetail(invoiceId)` returning a
DTO, called by `BillingService.getInvoiceDetail`, called by the handler.

---

## 2. Reaching an external service

### Good — the four-step port

```ts
// 1. Port — ports.ts (every copy, if contracts are copied)
export interface PaymentsClient {
  listCharges(account: AccountRef): Promise<Charge[]>;
  getCharge(account: AccountRef, id: string): Promise<ChargeDetail>;
  // …
}

// 2. Adapter — adapters/payments/vendor-client.ts, the ONLY file importing the SDK
import { VendorSdk } from 'payments-vendor-sdk';
export class VendorPaymentsClient implements PaymentsClient { /* … */ }

// 3. Wiring — the composition root (container.ts)
async payments(): Promise<PaymentsClient> {
  if (this.overrides.payments) return this.overrides.payments;
  if (this._payments) return this._payments;
  const key = await this.secrets.get('PAYMENTS_API_KEY');
  if (!key) throw new ConfigError('PAYMENTS_API_KEY is not configured');
  this._payments = new VendorPaymentsClient(key);
  return this._payments;
}

// 4. Test double — adapters/mocks.ts
export class MockPaymentsClient implements PaymentsClient { /* … */ }
```

The service asks for `PaymentsClient` and gets whichever implementation the
container decided on. That is the dependency inversion, and it is also why the
unit tests can be hermetic and key-free. (`integration-four-steps`,
`composition-root-only`)

### Bad

```ts
// modules/orders/service.ts
import { VendorSdk } from 'payments-vendor-sdk';

export class OrdersService {
  private payments = new VendorSdk({ apiKey: process.env.PAYMENTS_API_KEY });
}
```

Ring 3 now depends on a vendor SDK, reads the environment directly, and cannot
be tested without a key. Caught by `sdk-outside-adapters`.

---

## 3. What a repository returns

### Good

```ts
// repository.ts — knows the ORM, scopes by account
async getById(accountId: string, id: string): Promise<OrderRow | undefined> {
  const [row] = await this.db
    .select()
    .from(t.orders)
    .where(and(eq(t.orders.accountId, accountId), eq(t.orders.id, id)));
  return row;
}

// helpers.ts — the edge mapping, camelCase → snake_case
export function toOrderDto(row: OrderRow): Order { /* … */ }

// service.ts — speaks DTOs
async get(accountId: string, id: string): Promise<Order | undefined> {
  const row = await this.repo.getById(accountId, id);
  return row ? toOrderDto(row) : undefined;
}
```

(`wire-mapping-at-edge`, `services-speak-contracts`)

### Bad — returning the query builder

```ts
// repository.ts
getById(id: string) {
  return this.db.select().from(t.orders).where(eq(t.orders.id, id)); // not awaited
}

// service.ts — now holds an ORM query builder
const q = this.repo.getById(id).limit(1).offset(0);
```

The repository has become a thin, leaky wrapper: the service is coupled to the
ORM's API, and swapping the query or the ORM means changing both. A repository
that leaks its ORM is worse than no repository at all — see
[references.md](references.md). (`repository-returns-domain`)

### Bad — leaking the database error

```ts
// service.ts
try {
  await this.repo.insert(input);
} catch (e: any) {
  if (e.code === '23505') throw new ValidationError('Name already taken');
}
```

`23505` is a Postgres unique-violation code. Ring 3 should not know it.
Translate at the repository edge and throw `ValidationError` from there.
(`repository-returns-domain`)

---

## 4. Contract purity

### Good — `contracts/orders.ts`

```ts
import { z } from 'zod';

export const OrderStatus = z.enum(['PENDING', 'PAID', 'SHIPPED']);
export type OrderStatus = z.infer<typeof OrderStatus>;
```

Schema and type share a name; the file imports nothing but the schema
library. Every ring can depend on it because it depends on nothing.
(`schema-once`, `contracts-stay-pure`)

### Bad

```ts
import { z } from 'zod';
import type { PaymentsClient } from '../ports.js';   // ring 2 — outward
import { db } from '../db/client.js';                // ring 4 — much worse

export const Order = z.object({ /* … */ });
```

The innermost ring now transitively pulls in the database. Caught by
`contracts-stay-pure`.

---

## 5. Injecting ports rather than the container

### Acceptable — a common existing convention

```ts
export class FulfilmentService {
  constructor(private container: Container) {
    this.repo = new FulfilmentRepository(container.db);
    this.orders = container.ordersRepo;
  }
}
```

### Better — for new services

```ts
export class FulfilmentService {
  constructor(
    private repo: FulfilmentRepository,
    private orders: OrdersRepository,
    private payments: () => Promise<PaymentsClient>,
  ) {}
}
```

The dependencies are now visible in the signature, the test does not need a
container, and the service no longer imports the composition root — which is
exactly the `service ↔ container` cycle a dependency-rule tool's no-circular
rule warns about. (`inject-ports-not-container`)

---

## 6. Where a new piece of logic goes

| The code… | Ring | File |
|---|---|---|
| calls a payment provider's REST API | 4 | `adapters/payments/vendor-client.ts`, behind `PaymentsClient` |
| decides which orders ship together | 3 | `modules/fulfilment/service.ts` |
| computes a discount from line items | 1 | the pure core, e.g. `core/pricing.ts` |
| rejects an order whose lines cite unknown products | 1 | the pure core, e.g. `core/validation.ts` |
| converts currency amounts for reporting | 3 | a cross-cutting helper, e.g. `platform/currency.ts` |
| turns `totalCents` into `total_cents` | 4 (delivery) | `modules/orders/helpers.ts` |
| stores a shipment row | 4 | `modules/fulfilment/repository/shipment.repo.ts` |
| defines what an `Order` is | 1 | `contracts/orders.ts` (every copy) |
