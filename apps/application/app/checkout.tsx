"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  ApiError,
  api,
  message,
  money,
  Portal,
  useQuery,
} from "../../../packages/ui/src/yespiz/client";
import type { Catalog, Order } from "../../../packages/ui/src/yespiz/client";

export function Checkout() {
  const catalog = useQuery<Catalog>("customer", "/catalog");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef<{ hash: string; id: string } | null>(null);
  const menu = catalog.data?.menu ?? [];
  const items = menu
    .filter((p) => selected[p.id])
    .map((p) => ({ pizzaId: p.id, quantity: selected[p.id] }));
  const total = menu.reduce(
    (sum, pizza) => sum + (selected[pizza.id] ?? 0) * pizza.priceCents,
    0,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalog.data || !items.length || busy) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const body = { ...form, items, version: catalog.data.version };
    const hash = JSON.stringify(body);
    const requestId =
      retry.current?.hash === hash ? retry.current.id : crypto.randomUUID();
    retry.current = { hash, id: requestId };
    setBusy(true);
    setError("");
    try {
      const order = await api<Order>("customer", "/orders", {
        method: "POST",
        data: { ...body, requestId },
      });
      window.location.assign("/bestellungen#" + order.id);
    } catch (error) {
      setError(message(error));
      if (error instanceof ApiError && error.status === 409) catalog.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid order-grid">
      <section className="stack">
        <div>
          <p className="eyebrow">01 / MENÜ</p>
          <h2>Unsere Pizzen</h2>
        </div>
        <Alert>{catalog.error}</Alert>
        {catalog.data && !menu.length && (
          <p className="empty">Das Menü ist derzeit nicht verfügbar.</p>
        )}
        {menu.map((pizza) => (
          <article className="item row between" key={pizza.id}>
            <div className="detail">
              <h3>{pizza.name}</h3>
              <p className="muted">{pizza.description}</p>
              <p className="muted">Allergene: {pizza.allergens}</p>
            </div>
            <strong>{money(pizza.priceCents)}</strong>
            <label>
              Menge<span className="muted">{pizza.name}</span>
              <select
                value={selected[pizza.id] ?? 0}
                onChange={(event) =>
                  setSelected((values) => ({
                    ...values,
                    [pizza.id]: Number(event.target.value),
                  }))
                }
              >
                {Array.from({ length: 11 }, (_, index) => (
                  <option key={index}>{index}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </section>
      <section className="panel">
        <p className="eyebrow">02 / LIEFERUNG</p>
        <h2>Dein Warenkorb</h2>
        <Portal role="customer">
          {() => (
            <form className="stack" onSubmit={submit}>
              <label>
                Liefergebiet
                <select name="zoneId" required defaultValue="">
                  <option value="" disabled>
                    Gebiet auswählen
                  </option>
                  {catalog.data?.zones.map((zone) => (
                    <option value={zone.id} key={zone.id}>
                      {zone.postalCode} {zone.city} · {zone.name} ·{" "}
                      {zone.country}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Straße und Hausnummer
                <input
                  name="address"
                  autoComplete="street-address"
                  required
                  maxLength={180}
                />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={40}
                />
              </label>
              <p className="total row between">
                <span>Gesamt · Lieferung 0 €</span>
                <span>{money(total)}</span>
              </p>
              <Alert>{error}</Alert>
              <button
                disabled={busy || !items.length || !catalog.data?.zones.length}
              >
                {busy ? "Wird gesendet …" : "Unverbindlich anfragen"}
              </button>
              <p className="muted">
                Nach der Reservierung siehst du den Verkäufer, die Lieferzeit
                und verfügbare Zahlungsarten.
              </p>
            </form>
          )}
        </Portal>
      </section>
    </div>
  );
}
