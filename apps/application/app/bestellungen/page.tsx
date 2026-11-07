"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  basket,
  money,
  Portal,
  StatusBadge,
  statuses,
  time,
  useAction,
  useQuery,
} from "../../../../packages/ui/src/yespiz/client";
import type { Order } from "../../../../packages/ui/src/yespiz/client";

export default function Page() {
  return (
    <main className="wrap page">
      <div className="heading">
        <p className="eyebrow">DEIN KONTO</p>
        <h1>Bestellungen</h1>
        <p>Sieh den aktuellen Stand deiner Anfrage und deiner Lieferung.</p>
      </div>
      <Portal role="customer">{() => <OrderList />}</Portal>
    </main>
  );
}

function OrderList() {
  const [streamed, setStreamed] = useState<Order[]>();
  const scrolledTo = useRef("");
  const orders = useQuery<Order[]>(
    "customer",
    streamed ? null : "/orders",
    1200,
  );
  useEffect(() => {
    const stream = new EventSource("/api/platform/order-updates");
    stream.onmessage = (event) =>
      setStreamed(JSON.parse(event.data) as Order[]);
    stream.onerror = () => setStreamed(undefined);
    return () => stream.close();
  }, []);
  const items = streamed ?? orders.data;
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (
      !id ||
      scrolledTo.current === id ||
      !items?.some((order) => order.id === id)
    )
      return;
    document.getElementById(id)?.scrollIntoView();
    scrolledTo.current = id;
  }, [items]);
  return (
    <div className="stack">
      <Alert>{orders.error}</Alert>
      {items?.length === 0 && (
        <p className="empty">Du hast noch keine Bestellungen.</p>
      )}
      {items?.map((order) => (
        <OrderCard key={order.id} order={order} reload={orders.reload} />
      ))}
    </div>
  );
}

function OrderCard({ order, reload }: { order: Order; reload: () => void }) {
  const action = useAction("customer", reload);
  const base = "/orders/" + order.id;
  async function checkout() {
    const updated = await action.run<Order>(base + "/checkout");
    if (updated?.payment?.url) window.location.assign(updated.payment.url);
  }
  async function retrySearch() {
    const next = await action.run<Order>(base + "/retry");
    if (next) {
      window.location.assign(`/bestellungen?anfrage=${next.id}#${next.id}`);
    }
  }
  async function support(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await action.run(base + "/support", {
      category: "Kundenservice",
      note: new FormData(form).get("note"),
    });
    if (result) form.reset();
  }

  return (
    <article id={order.id} className="panel stack">
      <div className="row between">
        <h2>{basket(order.lines)}</h2>
        <StatusBadge status={order.status} />
      </div>
      <p className="muted">
        #{order.id.slice(0, 8)} · {order.zoneName} · {money(order.totalCents)} ·
        Lieferung 0 €
      </p>
      {order.search && (
        <SearchCountdown
          endsAt={order.search.endsAt}
          serverTime={order.search.serverTime}
        />
      )}
      {order.eta &&
        !["cancelled", "unavailable", "delivered"].includes(order.status) && (
          <div>
            <p className="eyebrow">VORAUSSICHTLICHE LIEFERUNG</p>
            <strong className="eta">
              {time(order.eta.from)}–{time(order.eta.to)}
            </strong>
          </div>
        )}
      {order.seller && (
        <address className="address">
          <strong>Verkäufer: {order.seller.name}</strong>
          <br />
          {order.seller.address}
          <br />
          {order.seller.phone} · {order.seller.email}
          <p className="muted">
            Das Restaurant verkauft, bereitet zu und liefert. yespiz vermittelt
            und nimmt Supportanfragen entgegen.
          </p>
        </address>
      )}
      {order.receiptReference && (
        <p className="notice">
          Belegnummer des Restaurants: {order.receiptReference}
        </p>
      )}
      <Alert>{action.error}</Alert>
      {order.status === "unavailable" && (
        <div className="stack">
          <p>
            Kein Restaurant konnte die Anfrage übernehmen. Du kannst es erneut
            versuchen oder zum Menü zurückgehen.
          </p>
          <div className="row">
            <button disabled={action.busy} onClick={() => void retrySearch()}>
              {action.busy ? "Wird angefragt …" : "Erneut anfragen"}
            </button>
            <a className="button secondary" href="/">
              Zum Menü
            </a>
          </div>
        </div>
      )}
      {order.status === "reserved" && (
        <div className="stack">
          <p>
            Reserviert bis {time(order.confirmBy!)}. Prüfe die Bestellung, bevor
            du zahlungspflichtig bestellst.
          </p>
          <ul className="progress">
            {order.lines.map((line) => (
              <li key={line.pizza.id}>
                {line.pizza.name} · Allergene: {line.pizza.allergens}
              </li>
            ))}
          </ul>
          <div className="row">
            {order.methods?.cash && (
              <button
                disabled={action.busy}
                onClick={() => void action.run(base + "/cash")}
              >
                Zahlungspflichtig bestellen · Barzahlung
              </button>
            )}
            {order.methods?.online && (
              <button disabled={action.busy} onClick={() => void checkout()}>
                Online zur Zahlung
              </button>
            )}
          </div>
        </div>
      )}
      {order.status === "payment_pending" &&
        (order.payment?.url ? (
          <div>
            <a className="button" href={order.payment.url}>
              Zur Zahlung zurückkehren
            </a>
          </div>
        ) : (
          <div>
            <button disabled={action.busy} onClick={() => void checkout()}>
              Zahlungslink abrufen
            </button>
          </div>
        ))}
      {["searching", "reserved", "confirmed"].includes(order.status) &&
        order.payment?.state !== "paid" && (
          <div>
            <button
              className="secondary"
              disabled={action.busy}
              onClick={() => void action.run(base + "/cancel")}
            >
              Stornieren
            </button>
          </div>
        )}
      {order.payment?.state === "refunded" && (
        <p className="notice">Zahlung erstattet.</p>
      )}
      <details>
        <summary>Verlauf und Hilfe</summary>
        <ol className="progress">
          {order.timeline.map((step, index) => (
            <li key={index}>
              {time(step.at)} · {statuses[step.status]}
            </li>
          ))}
        </ol>
        <form className="stack" onSubmit={support}>
          <label>
            Nachricht an den Support
            <textarea name="note" required maxLength={1000} />
          </label>
          <div>
            <button className="secondary" disabled={action.busy}>
              Nachricht erfassen
            </button>
          </div>
        </form>
      </details>
    </article>
  );
}

function SearchCountdown({ endsAt, serverTime }: NonNullable<Order["search"]>) {
  const [elapsed, setElapsed] = useState({ serverTime, milliseconds: 0 });
  useEffect(() => {
    const receivedAt = performance.now();
    const interval = window.setInterval(() => {
      setElapsed({ serverTime, milliseconds: performance.now() - receivedAt });
    }, 250);
    return () => window.clearInterval(interval);
  }, [serverTime]);

  const milliseconds =
    elapsed.serverTime === serverTime ? elapsed.milliseconds : 0;
  const seconds = Math.max(
    0,
    Math.ceil((endsAt - serverTime - milliseconds) / 1000),
  );
  return (
    <p className="notice">
      {seconds > 0
        ? `Wir suchen ein Restaurant. Die Suche dauert noch höchstens ${seconds} Sekunden.`
        : "Die Suchzeit ist abgelaufen. Wir prüfen den letzten Stand."}
    </p>
  );
}
