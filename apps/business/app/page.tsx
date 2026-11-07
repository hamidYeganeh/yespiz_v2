"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  basket,
  money,
  Portal,
  StatusBadge,
  time,
  useAction,
  useQuery,
} from "../../../packages/ui/src/yespiz/client";
import type {
  Line,
  OperationalOrder,
} from "../../../packages/ui/src/yespiz/client";

type Kitchen = {
  id: string;
  name: string;
  accepting: boolean;
  enabled: boolean;
  couriers: { id: string; name: string }[];
  offers: {
    id: string;
    orderId: string;
    expiresAt: number;
    lines: Line[];
    zoneName: string;
    totalCents: number;
  }[];
  orders: OperationalOrder[];
};

export default function Page() {
  return (
    <main className="wrap page">
      <div className="heading">
        <p className="eyebrow">YESPIZ / RESTAURANT</p>
        <h1>Küchenzentrale</h1>
        <p>
          Neue Anfragen beantworten, Bestellungen vorbereiten und die Abholung
          bestätigen.
        </p>
      </div>
      <Portal role="kitchen">{() => <Board />}</Portal>
    </main>
  );
}

function Board() {
  const query = useQuery<{ serverTime: number; kitchens: Kitchen[] }>(
    "kitchen",
    "/kitchen",
    1000,
  );
  return (
    <div className="stack">
      <Alert>{query.error}</Alert>
      {query.data?.kitchens.length === 0 && (
        <p className="empty">Kein Restaurant zugeordnet.</p>
      )}
      {query.data?.kitchens.map((kitchen) => (
        <KitchenCard
          key={kitchen.id}
          kitchen={kitchen}
          serverTime={query.data!.serverTime}
          reload={query.reload}
        />
      ))}
    </div>
  );
}

function KitchenCard({
  kitchen,
  serverTime,
  reload,
}: {
  kitchen: Kitchen;
  serverTime: number;
  reload: () => void;
}) {
  const action = useAction("kitchen", reload);
  const [pickup, setPickup] = useState<{ code: string; expiresAt: number }>();
  const ready = kitchen.orders.filter((order) => order.status === "ready");
  async function handover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const result = await action.run<{ code: string; expiresAt: number }>(
      "/kitchen/" + kitchen.id + "/pickup",
      {
        courierId: fields.get("courier"),
        orderIds: fields.getAll("orders"),
      },
    );
    if (result) {
      setPickup(result);
      form.reset();
    }
  }
  return (
    <section className="panel stack" aria-label={kitchen.name}>
      <div className="row between">
        <h2>{kitchen.name}</h2>
        <button
          className="secondary"
          disabled={action.busy || !kitchen.enabled}
          onClick={() =>
            void action.run("/kitchen/" + kitchen.id + "/availability", {
              accepting: !kitchen.accepting,
            })
          }
        >
          {kitchen.accepting ? "Annahme pausieren" : "Annahme starten"}
        </button>
      </div>
      <Alert>{action.error}</Alert>
      <div className="grid">
        <div className="stack">
          <h3>Neue Anfragen</h3>
          {!kitchen.offers.length && (
            <p className="empty">Keine offenen Anfragen.</p>
          )}
          {kitchen.offers.map((offer) => {
            const remaining = Math.max(
              0,
              Math.ceil((offer.expiresAt - serverTime) / 1000),
            );
            const url =
              "/kitchen/" +
              kitchen.id +
              "/orders/" +
              offer.orderId +
              "/offers/" +
              offer.id;
            return (
              <article key={offer.id} className="entry stack">
                <div className="row between">
                  <strong>{basket(offer.lines)}</strong>
                  <span className="badge">{remaining} s</span>
                </div>
                <p className="muted">
                  {offer.zoneName} · {money(offer.totalCents)}
                </p>
                <div className="row">
                  <button
                    className="secondary"
                    disabled={action.busy || !remaining}
                    onClick={() => void action.run(url, { action: "reject" })}
                  >
                    Ablehnen
                  </button>
                  <button
                    disabled={action.busy || !remaining}
                    onClick={() => void action.run(url, { action: "accept" })}
                  >
                    Reservieren
                  </button>
                </div>
              </article>
            );
          })}
          {ready.length > 0 && (
            <form className="entry stack" onSubmit={handover}>
              <h3>Abholcode erstellen</h3>
              <label>
                Fahrer
                <select name="courier" required defaultValue="">
                  <option value="" disabled>
                    Auswählen
                  </option>
                  {kitchen.couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="stack">
                <legend>Bis zu drei fertige Bestellungen</legend>
                {ready.map((order) => (
                  <label className="check" key={order.id}>
                    <input type="checkbox" name="orders" value={order.id} />#
                    {order.id.slice(0, 8)} · {basket(order.lines)}
                  </label>
                ))}
              </fieldset>
              <div>
                <button disabled={action.busy || !kitchen.couriers.length}>
                  Code erstellen
                </button>
              </div>
            </form>
          )}
          {pickup && pickup.expiresAt > serverTime && (
            <div className="notice">
              <strong className="eta">{pickup.code}</strong>
              <p>
                Nur dem zugewiesenen Fahrer geben. Gültig bis{" "}
                {time(pickup.expiresAt)}.
              </p>
            </div>
          )}
        </div>
        <div className="stack">
          <h3>Bestellungen</h3>
          {!kitchen.orders.length && (
            <p className="empty">Keine bestätigten Bestellungen.</p>
          )}
          {kitchen.orders.map((order) => (
            <article className="entry stack" key={order.id}>
              <div className="row between">
                <strong>{basket(order.lines)}</strong>
                <StatusBadge status={order.status} />
              </div>
              <p className="muted">
                #{order.id.slice(0, 8)} · {money(order.totalCents)} · Provision{" "}
                {money(order.commissionCents ?? 0)}
              </p>
              {order.receiptReference && (
                <p>Belegnummer: {order.receiptReference}</p>
              )}
              {order.status === "delivered" &&
                order.payment?.state === "paid" &&
                !order.receiptReference && (
                  <form
                    className="stack"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const reference = new FormData(event.currentTarget).get(
                        "reference",
                      );
                      void action.run(
                        `/kitchen/orders/${order.id}/receipt`,
                        { reference },
                        "PUT",
                      );
                    }}
                  >
                    <label>
                      Belegnummer aus der Kasse
                      <input name="reference" required maxLength={80} />
                    </label>
                    <div>
                      <button disabled={action.busy}>
                        Belegnummer speichern
                      </button>
                    </div>
                  </form>
                )}
              {order.status === "confirmed" && (
                <div>
                  <button
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        "/kitchen/orders/" + order.id + "/status",
                        { action: "preparing" },
                      )
                    }
                  >
                    Zubereitung starten
                  </button>
                </div>
              )}
              {order.status === "preparing" && (
                <div>
                  <button
                    disabled={action.busy}
                    onClick={() =>
                      void action.run(
                        "/kitchen/orders/" + order.id + "/status",
                        { action: "ready" },
                      )
                    }
                  >
                    Als fertig markieren
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
