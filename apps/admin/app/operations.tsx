import type { FormEvent } from "react";
import {
  Alert,
  basket,
  money,
  StatusBadge,
  time,
  useAction,
  useQuery,
} from "../../../packages/ui/src/yespiz/client";
import type { OperationalOrder } from "../../../packages/ui/src/yespiz/client";

type Incident = {
  id: string;
  orderId: string;
  category: string;
  note: string;
  createdAt: number;
  resolvedAt?: number;
  resolution?: string;
};
type Audit = { id: string; action: string; target: string; at: number };

export function Operations() {
  const query = useQuery<{
    orders: OperationalOrder[];
    incidents: Incident[];
    audit: Audit[];
  }>("admin", "/admin/operations", 1800);
  const action = useAction("admin", query.reload);
  function resolve(event: FormEvent<HTMLFormElement>, incident: Incident) {
    event.preventDefault();
    void action.run("/admin/incidents/" + incident.id + "/resolve", {
      resolution: String(
        new FormData(event.currentTarget).get("resolution") ?? "",
      ),
    });
  }
  return (
    <div className="stack">
      <Alert>{action.error || query.error}</Alert>
      <div className="grid">
        <section className="stack">
          <h2>Bestellungen</h2>
          {query.data?.orders.length === 0 && (
            <p className="empty">Noch keine Bestellungen.</p>
          )}
          {query.data?.orders.map((order) => (
            <article key={order.id} className="panel stack">
              <div className="row between">
                <strong>{basket(order.lines)}</strong>
                <StatusBadge status={order.status} />
              </div>
              <p className="muted">
                #{order.id.slice(0, 8)} · {order.seller?.name ?? order.zoneName}{" "}
                · {money(order.totalCents)} · Provision{" "}
                {money(order.commissionCents ?? 0)}
              </p>
              {order.payment && (
                <p className="muted">
                  Zahlung: {order.payment.method === "cash" ? "Bar" : "Stripe"}{" "}
                  · {order.payment.state}
                </p>
              )}
              {order.receiptReference && (
                <p className="muted">Belegnummer: {order.receiptReference}</p>
              )}
              <div className="row">
                {order.status === "delivered" &&
                  order.payment?.method === "cash" &&
                  order.payment.state === "paid" &&
                  (order.cashSettledAt ? (
                    <span className="badge">Bargeld abgeglichen</span>
                  ) : (
                    <button
                      className="secondary"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          "/admin/orders/" + order.id + "/settle-cash",
                        )
                      }
                    >
                      Bargeld abgleichen
                    </button>
                  ))}
                {order.status === "picked_up" && (
                  <button
                    className="secondary"
                    disabled={action.busy}
                    onClick={() => {
                      const reason = window.prompt(
                        "Warum konnte nicht zugestellt werden?",
                      );
                      if (reason?.trim())
                        void action.run(
                          "/admin/orders/" + order.id + "/failed-stop",
                          { reason },
                        );
                    }}
                  >
                    Zustellung fehlgeschlagen
                  </button>
                )}
                {[
                  "searching",
                  "reserved",
                  "confirmed",
                  "preparing",
                  "ready",
                ].includes(order.status) &&
                  order.payment?.state !== "paid" && (
                    <button
                      disabled={action.busy}
                      className="secondary"
                      onClick={() =>
                        void action.run("/admin/orders/" + order.id + "/cancel")
                      }
                    >
                      Stornieren
                    </button>
                  )}
                {order.payment?.method === "stripe" &&
                  ["paid", "review"].includes(order.payment.state) &&
                  ["confirmed", "cancelled", "delivered"].includes(
                    order.status,
                  ) && (
                    <button
                      disabled={action.busy}
                      className="secondary"
                      onClick={() => {
                        if (
                          window.confirm("Diese Zahlung vollständig erstatten?")
                        )
                          void action.run(
                            "/admin/orders/" + order.id + "/refund",
                          );
                      }}
                    >
                      Erstatten
                    </button>
                  )}
              </div>
            </article>
          ))}
        </section>
        <section className="stack">
          <h2>Meldungen</h2>
          {query.data?.incidents.length === 0 && (
            <p className="empty">Keine Meldungen.</p>
          )}
          {query.data?.incidents.map((item) => (
            <article key={item.id} className="panel stack">
              <strong>
                {item.category} · #{item.orderId.slice(0, 8)}
              </strong>
              <p>{item.note}</p>
              {item.resolution ? (
                <p className="notice">{item.resolution}</p>
              ) : (
                <form
                  className="stack"
                  onSubmit={(event) => resolve(event, item)}
                >
                  <label>
                    Maßnahme
                    <textarea name="resolution" required maxLength={1000} />
                  </label>
                  <div>
                    <button disabled={action.busy}>Abschließen</button>
                  </div>
                </form>
              )}
            </article>
          ))}
          <details className="panel">
            <summary>Änderungsprotokoll</summary>
            {query.data?.audit.map((entry) => (
              <p className="muted" key={entry.id}>
                {time(entry.at)} · {entry.action} · {entry.target}
              </p>
            ))}
          </details>
        </section>
      </div>
    </div>
  );
}
