"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  money,
  Portal,
  StatusBadge,
  time,
  useAction,
  useQuery,
} from "../../../../packages/ui/src/yespiz/client";
import type { Status } from "../../../../packages/ui/src/yespiz/client";

type Stop = {
  id: string;
  status: Status;
  address: string;
  phone: string;
  cashDue: number;
  eta?: { from: number; to: number };
};
type Board = {
  kitchens: { id: string; name: string }[];
  trip?: { id: string; stops: Stop[] };
};

export default function Page() {
  return (
    <main className="wrap page">
      <div className="heading">
        <p className="eyebrow">YESPIZ / FAHRER</p>
        <h1>Meine Fahrt</h1>
        <p>Bestellungen abholen, Stopps öffnen und die Zustellung erfassen.</p>
      </div>
      <Portal role="courier">{() => <Courier />}</Portal>
    </main>
  );
}

function Courier() {
  const query = useQuery<Board>("courier", "/courier", 1600);
  const action = useAction("courier", query.reload);
  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await action.run(
      "/courier/pickup",
      Object.fromEntries(new FormData(event.currentTarget)),
    );
  }
  return (
    <div className="stack">
      <Alert>{query.error || action.error}</Alert>
      {!query.data && !query.error && (
        <p className="muted">Fahrt wird geladen …</p>
      )}
      {query.data?.trip ? (
        <section className="stack">
          <h2>Lieferstopps</h2>
          {query.data.trip.stops.map((stop, index) => (
            <DeliveryStop
              stop={stop}
              index={index}
              key={stop.id}
              reload={query.reload}
            />
          ))}
        </section>
      ) : (
        query.data && (
          <form className="panel stack auth" onSubmit={redeem}>
            <h2>Abholung</h2>
            <label>
              Restaurant
              <select name="kitchenId" required defaultValue="">
                <option value="" disabled>
                  Restaurant wählen
                </option>
                {query.data.kitchens.map((kitchen) => (
                  <option key={kitchen.id} value={kitchen.id}>
                    {kitchen.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Abholcode
              <input
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
              />
            </label>
            <button disabled={action.busy || !query.data.kitchens.length}>
              Abholung bestätigen
            </button>
          </form>
        )
      )}
    </div>
  );
}

function DeliveryStop({
  stop,
  index,
  reload,
}: {
  stop: Stop;
  index: number;
  reload: () => void;
}) {
  const action = useAction("courier", reload);
  const [cash, setCash] = useState(false);
  const [reported, setReported] = useState(false);
  async function incident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = await action.run(
      "/courier/orders/" + stop.id + "/incident",
      Object.fromEntries(new FormData(form)),
    );
    if (result) {
      form.reset();
      setReported(true);
    }
  }
  return (
    <article className="panel stack">
      <div className="row between">
        <h3>
          Stopp {index + 1} · #{stop.id.slice(0, 8)}
        </h3>
        <StatusBadge status={stop.status} />
      </div>
      <address className="address">
        {stop.address}
        <br />
        <a href={"tel:" + stop.phone}>{stop.phone}</a>
      </address>
      {stop.eta && (
        <p className="muted">
          Lieferfenster {time(stop.eta.from)}–{time(stop.eta.to)}
        </p>
      )}
      <Alert>{action.error}</Alert>
      {stop.status === "picked_up" && (
        <div className="stack">
          <div>
            <a
              className="button secondary"
              href={
                "https://www.google.com/maps/dir/?api=1&destination=" +
                encodeURIComponent(stop.address)
              }
              target="_blank"
              rel="noreferrer"
            >
              Navigation öffnen
            </a>
          </div>
          {stop.cashDue > 0 && (
            <label className="check">
              <input
                type="checkbox"
                checked={cash}
                onChange={(event) => setCash(event.target.checked)}
              />
              {money(stop.cashDue)} bar erhalten
            </label>
          )}
          <div>
            <button
              disabled={action.busy || (stop.cashDue > 0 && !cash)}
              onClick={() =>
                void action.run("/courier/orders/" + stop.id + "/deliver", {
                  cashReceived: cash,
                })
              }
            >
              Als zugestellt markieren
            </button>
          </div>
          <details>
            <summary>Problem melden</summary>
            <form className="stack" onSubmit={incident}>
              <label>
                Kategorie
                <select name="category">
                  <option>Adresse nicht auffindbar</option>
                  <option>Kunde nicht erreichbar</option>
                  <option>Paket beschädigt</option>
                  <option>Fahrzeug oder Sicherheit</option>
                  <option>Anderes Problem</option>
                </select>
              </label>
              <label>
                Beschreibung
                <textarea name="note" required maxLength={1000} />
              </label>
              <div>
                <button className="secondary" disabled={action.busy}>
                  Meldung senden
                </button>
              </div>
              {reported && (
                <p className="notice" role="status">
                  Die Meldung wurde erfasst.
                </p>
              )}
            </form>
          </details>
        </div>
      )}
    </article>
  );
}
