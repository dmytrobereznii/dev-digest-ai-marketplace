# frontend-architecture — worked examples

The pairs below are illustrative, for a Next.js App Router app over a neutral
orders domain. The "good" column is the shape to copy; the "bad" column is
either the kind of code a repo records as accepted debt (marked **debt**) or a
plausible mistake.

---

## 1. A route entry

### Good — `app/orders/page.tsx`

```tsx
import { OrdersListView } from "./_components/OrdersListView";

/* Route: /orders (Orders list). Thin route entry — the view, its create modal,
   styles, constants, helpers and i18n are colocated under _components/OrdersListView. */
export default function OrdersPage() {
  return <OrdersListView />;
}
```

Six lines, no `"use client"`, no hooks, no data. The page is a shell; the view
below it owns the interactivity and carries the directive. This is the target
shape for every route. (`page-is-composition-root`,
`client-directive-at-subtree-entry`)

### Bad (**debt**) — `app/accounts/[accountId]/orders/[orderId]/page.tsx`

```tsx
"use client";
// …
import { AppShell } from "../../../../../components/app-shell";
import { useOrderDetail, useOrders } from "../../../../../lib/hooks";
import { useShipments, useCancelShipment } from "../../../../../lib/hooks/shipments";
```

Three problems in the import block alone: the whole route is a Client Component
because the page is, the paths climb five levels instead of using the alias,
and one import goes through the aggregating `lib/hooks` barrel while the next
reaches the module directly. Leave it until you are working on this route.
(`use-the-alias`, `no-aggregating-barrels`)

---

## 2. Constants and helpers at rung 0

### Good — `_components/OrderTable/constants.ts`

```ts
/** Orders older than this many days are hidden when "hide stale" is on. */
export const STALE_AFTER_DAYS = 30;

/** Keyboard shortcut → row action. */
export const KEY_TO_ACTION: Record<string, OrderActionKind> = {
  r: "refund",
  c: "cancel",
};
```

Named, doc-commented, and scoped to the one component that uses them. Neither
value appears as a literal in the JSX. (`constants-at-owning-rung`)

### Good — `_components/OrderTable/helpers.ts`

```ts
import { FILTERABLE_STATUSES, STALE_AFTER_DAYS, STATUS_ORDER } from "./constants";

/** Keep the selected status (null = all), optionally drop stale orders,
 *  sort by status. */
export function visibleOrders(
  orders: OrderRecord[],
  hideStale: boolean,
  status: string | null,
): OrderRecord[] {
  let shown = status ? orders.filter((o) => o.status === status) : orders;
  if (hideStale) shown = shown.filter((o) => o.age_days < STALE_AFTER_DAYS);
  return [...shown].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );
}
```

No React import, no hooks, one direction of dependency (`helpers` → `constants`,
never back). That is what makes `helpers.test.ts` possible without rendering
anything. (`helpers-are-pure`)

### Bad — the same logic inlined

```tsx
const shown = orders
  .filter((o) => !status || o.status === status)
  .filter((o) => !hideStale || o.age_days < 30)   // magic number in JSX
  .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
```

Now the threshold is a literal, the rule cannot be tested without mounting the
component, and the next component that needs the same filter copies it.

---

## 3. What stays state, what calls a helper

### Good — `_components/OrderTable/OrderTable.tsx`

```tsx
const counts = React.useMemo(() => countByStatus(orders), [orders]);
const statuses = presentStatuses(counts);
// A refetch can drop the last order of the selected status; fall back to all.
const statusFilter = selected && counts[selected] ? selected : null;
const shown = React.useMemo(
  () => visibleOrders(orders, hideStale, statusFilter),
  [orders, hideStale, statusFilter],
);
```

Only `selected`, `hideStale` and `focusIdx` are state — the three things a user
actually changes. Counts, the visible statuses, the effective filter and the
final list are all computed in render from those three plus props.
(`state-decision-tree`)

## 4. A data hook

### Good — `lib/hooks/shipments.ts`

```ts
/** All shipments for an order — delivered, failed (with error), cancelled,
   in transit. Polls while anything is in transit so it self-updates. */
export function useOrderShipments(orderId: string | null | undefined) {
  return useQuery({
    queryKey: ["order-shipments", orderId],
    queryFn: () => api.get<ShipmentSummary[]>(`/orders/${orderId}/shipments`),
    enabled: !!orderId,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((s) => s.status === "in_transit") ? 4000 : false,
  });
}
```

The key holds exactly the variable the query function uses. The key and the
function sit together, in the domain file, not in a global key registry. The
hook earns its existence: the polling policy is the thing being named.
(`query-key-is-dependency-array`, `hook-earns-its-keep`)

### Bad — fetching from the component

```tsx
const [shipments, setShipments] = React.useState<ShipmentSummary[]>([]);
React.useEffect(() => {
  fetch(`${API_BASE}/orders/${orderId}/shipments`).then((r) => r.json()).then(setShipments);
}, [orderId]);
```

Skips the API client, so failures never become the app's error type and the
error UX has nothing to branch on. No dedupe, no cache, no polling, and a
second component rendering the same data fetches it again. (`one-transport`,
`server-cache-not-state`)

---

## 5. Types

### Good — anywhere in the frontend

```ts
import type { OrderRecord, ShipmentSummary } from "<shared-contracts-package>";
```

### Bad — a local restatement

```ts
interface Order {
  id: string;
  status: string;      // the contract has a union
  total_cents: number;
  created_at: string;
}
```

The shape now exists twice and drifts silently the first time the backend adds
a field. If the contracts are already copied into more than one package, a
further copy inside a component is how the drift becomes invisible.
(`contracts-from-shared`)

---

## 6. Barrels

### Good — `_components/OrderTable/index.ts`

```ts
export { OrderTable, OrderTable as default } from "./OrderTable";
```

One line, one module, explicit names. Keeps the import `./_components/OrderTable`
instead of `./_components/OrderTable/OrderTable`.

### Bad — the App Router build error

```ts
export * from "./OrderTable";
export { default } from "./OrderTable";
```

Fails the build with `the name 'default' is exported multiple times`. The risk
is someone "simplifying" the good form into it.

### Bad (**debt**) — `lib/hooks/index.ts`

```ts
export * from "./core";
export * from "./orders";
export * from "./shipments";
export * from "./invoices";
export * from "./customers";
```

Importing one hook through this pulls all five modules in synchronously, and it
is the shape that produces `module → index → module` cycles. It stays for
existing callers; new code imports `@/lib/hooks/shipments`.
(`no-aggregating-barrels`)

---

## 7. The client boundary

### Good — `app/layout.tsx`

```tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} …>
      <body suppressHydrationWarning>
        <IntlClientProvider locale={locale} messages={messages}>
          <Suspense fallback={null}>
            <Providers>{children}</Providers>
```

An `async` Server Component that *renders* client providers without becoming a
Client Component itself. `children` arrives as already-rendered elements, so a
server subtree can sit inside `<Providers>` without entering the client graph.

### Bad — hoisting the directive to the top

```tsx
"use client";
export default function RootLayout({ children }) { … }
```

Every module imported from the layout is now in the client graph, including
ones that never needed to be. The directive marks the *entry* to a client
subtree; put it on the interactive leaf instead.
(`client-directive-at-subtree-entry`)

### Bad — a compound component across the seam

```tsx
// Server Component
import { Menu } from "<design-system-package>";
<Menu><Menu.Item /></Menu>   // Menu.Item is undefined → "Element type is invalid"
```

A Server Component importing a Client Component receives a client reference,
not the function, so static properties are gone. Export `Menu` and `MenuItem`
as separate named exports instead. (`no-compound-components-across-seam`)
