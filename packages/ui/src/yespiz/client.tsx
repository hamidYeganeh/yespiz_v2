"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

export type Role = "customer" | "admin" | "kitchen" | "courier";
export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  kitchenIds: string[];
  suspended: boolean;
};
export type Zone = {
  id: string;
  country: string;
  region: string;
  city: string;
  name: string;
  postalCode: string;
  travelMinutes: number;
  enabled: boolean;
};
export type Pizza = {
  id: string;
  name: string;
  description: string;
  allergens: string;
  priceCents: number;
  prepMinutes: number;
  enabled: boolean;
};
export type Kitchen = {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  zoneIds: string[];
  pizzaIds: string[];
  quality: number;
  capacity: number;
  commissionBps: number;
  enabled: boolean;
  accepting: boolean;
  cash: boolean;
  stripeAccount: string;
  klarna: boolean;
};
export type Settings = {
  version: number;
  zones: Zone[];
  menu: Pizza[];
  kitchens: Kitchen[];
};
export type Catalog = Omit<Settings, "kitchens">;
export type Status =
  | "searching"
  | "reserved"
  | "payment_pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "unavailable";
export type Line = { pizza: Pizza; quantity: number };
export type Order = {
  id: string;
  status: Status;
  lines: Line[];
  totalCents: number;
  zoneName: string;
  eta?: { from: number; to: number };
  seller?: { name: string; address: string; phone: string; email: string };
  receiptReference?: string;
  timeline: { status: Status; at: number }[];
  search?: { endsAt: number; serverTime: number };
  confirmBy?: number;
  methods?: { cash: boolean; online: boolean };
  payment?: {
    method: "cash" | "stripe";
    state: "due" | "pending" | "paid" | "review" | "refunded";
    url?: string;
  };
};
export type OperationalOrder = Order & {
  commissionCents?: number;
  cashSettledAt?: number;
  address: string;
  phone: string;
};

export const statuses: Record<Status, string> = {
  searching: "Restaurant wird gesucht",
  reserved: "Kapazität reserviert",
  payment_pending: "Zahlung ausstehend",
  confirmed: "Bestellung bestätigt",
  preparing: "In Zubereitung",
  ready: "Bereit zur Abholung",
  picked_up: "Unterwegs",
  delivered: "Geliefert",
  cancelled: "Storniert",
  unavailable: "Aktuell nicht verfügbar",
};
const euros = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
});
const clock = new Intl.DateTimeFormat("de-AT", {
  timeZone: "Europe/Vienna",
  hour: "2-digit",
  minute: "2-digit",
});
export const money = (cents: number) => euros.format(cents / 100);
export const time = (stamp: number) => clock.format(stamp);
export const basket = (lines: Line[]) =>
  lines.map(({ quantity, pizza }) => quantity + " × " + pizza.name).join(", ");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export const message = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Verbindung fehlgeschlagen. Bitte erneut versuchen.";

export async function api<T>(
  role: Role,
  path: string,
  options: { method?: string; data?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const result = await fetch("/api/platform" + path, {
    method: options.method ?? "GET",
    cache: "no-store",
    signal: options.signal,
    headers: {
      "X-Yespiz-Portal": role,
      ...(options.data !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: options.data === undefined ? undefined : JSON.stringify(options.data),
  });
  if (!result.ok) {
    const body = (await result.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new ApiError(
      body?.message ?? "Der Dienst ist derzeit nicht erreichbar.",
      result.status,
    );
  }
  return result.status === 204
    ? (undefined as T)
    : (result.json() as Promise<T>);
}

export function useQuery<T>(role: Role, path: string | null, interval = 0) {
  const [state, setState] = useState<{
    path: string;
    data?: T;
    error?: string;
    status?: number;
  }>();
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    if (!path) return;
    const target = path;
    const abort = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;
    async function fetchData() {
      try {
        const data = await api<T>(role, target, { signal: abort.signal });
        if (!abort.signal.aborted) setState({ path: target, data });
      } catch (error) {
        if (!abort.signal.aborted)
          setState((previous) => ({
            path: target,
            data: previous?.path === target ? previous.data : undefined,
            error: message(error),
            status: error instanceof ApiError ? error.status : undefined,
          }));
      } finally {
        if (interval && !abort.signal.aborted)
          timeout = setTimeout(fetchData, interval);
      }
    }
    void fetchData();
    return () => {
      abort.abort();
      clearTimeout(timeout);
    };
  }, [role, path, interval, revision]);
  return { ...(state?.path === path ? state : undefined), reload };
}

export function Alert({ children }: { children?: ReactNode }) {
  return children ? (
    <p role="alert" className="alert">
      {children}
    </p>
  ) : null;
}

export function StatusBadge({ status }: { status: Status }) {
  return <span className={"badge " + status}>{statuses[status]}</span>;
}

export function Portal({
  role,
  children,
}: {
  role: Role;
  children: (user: User) => ReactNode;
}) {
  const session = useQuery<User>(role, "/me");
  const [user, setUser] = useState<User | null>();
  const [create, setCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = user === undefined ? session.data : user;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      setUser(
        await api<User>(role, create ? "/register" : "/login", {
          method: "POST",
          data: fields,
        }),
      );
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setError("");
    try {
      await api<void>(role, "/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      setError(message(error));
    }
  }

  if (current)
    return (
      <>
        <div className="session">
          <span>
            Angemeldet als <strong>{current.name}</strong>
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => void logout()}
          >
            Abmelden
          </button>
        </div>
        <Alert>{error}</Alert>
        {children(current)}
      </>
    );

  if (user === undefined && !session.status && !session.error)
    return <p className="muted">Zugang wird geladen …</p>;
  return (
    <form className="panel auth" onSubmit={submit}>
      <p className="eyebrow">KONTO</p>
      <h2>{create ? "Konto erstellen" : "Anmelden"}</h2>
      {create && (
        <label>
          Name
          <input name="name" autoComplete="name" required maxLength={80} />
        </label>
      )}
      <label>
        E-Mail
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Passwort
        <input
          name="password"
          type="password"
          autoComplete={create ? "new-password" : "current-password"}
          minLength={create ? 12 : undefined}
          required
        />
      </label>
      <Alert>
        {error || (session.status !== 401 ? session.error : undefined)}
      </Alert>
      <button disabled={busy}>
        {busy ? "Bitte warten …" : create ? "Konto erstellen" : "Anmelden"}
      </button>
      {role === "customer" && (
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setCreate(!create);
            setError("");
          }}
        >
          {create ? "Bereits ein Konto? Anmelden" : "Neues Konto erstellen"}
        </button>
      )}
    </form>
  );
}

export function useAction(role: Role, reload: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run<T>(
    path: string,
    data?: unknown,
    method = "POST",
  ): Promise<T | undefined> {
    setBusy(true);
    setError("");
    try {
      return await api<T>(role, path, { method, data });
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
      reload();
    }
  }
  return { run, busy, error };
}
