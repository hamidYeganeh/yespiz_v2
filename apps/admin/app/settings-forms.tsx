import type { FormEvent, ReactNode } from "react";
import type {
  Kitchen,
  Pizza,
  Settings,
  Zone,
} from "../../../packages/ui/src/yespiz/client";

export function Form({
  title,
  children,
  busy,
  submit,
}: {
  title: string;
  children: ReactNode;
  busy: boolean;
  submit: (fields: FormData) => void;
}) {
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(new FormData(event.currentTarget));
  }
  return (
    <form className="panel stack" onSubmit={save}>
      <h2>{title}</h2>
      <fieldset className="form-grid" disabled={busy}>
        {children}
      </fieldset>
      <div>
        <button disabled={busy}>{busy ? "Speichern …" : "Speichern"}</button>
      </div>
    </form>
  );
}

export function TextField({
  label,
  name,
  value,
  optional = false,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string;
  optional?: boolean;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        defaultValue={value}
        type={type}
        required={!optional}
        maxLength={254}
      />
    </label>
  );
}

function NumberField({
  label,
  name,
  value,
  min,
  max,
  step = 1,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type="number"
        defaultValue={value}
        min={min}
        max={max}
        step={step}
        required
      />
    </label>
  );
}

function Check({
  label,
  name,
  checked,
}: {
  label: string;
  name: string;
  checked: boolean;
}) {
  return (
    <label className="check">
      <input type="checkbox" name={name} defaultChecked={checked} />
      {label}
    </label>
  );
}

export function Choices({
  title,
  name,
  options,
  values,
}: {
  title: string;
  name: string;
  options: { id: string; name: string }[];
  values: string[];
}) {
  return (
    <fieldset className="full stack">
      <legend>{title}</legend>
      {options.map((option) => (
        <label key={option.id} className="check">
          <input
            type="checkbox"
            name={name}
            value={option.id}
            defaultChecked={values.includes(option.id)}
          />
          {option.name}
        </label>
      ))}
    </fieldset>
  );
}

export const value = (data: FormData, name: string) =>
  String(data.get(name) ?? "");
const number = (data: FormData, name: string, scale = 1) =>
  Math.round(Number(value(data, name)) * scale);
export const values = (data: FormData, name: string) =>
  data.getAll(name).map(String);

export function ZoneForm({
  zone,
  busy,
  save,
}: {
  zone?: Zone;
  busy: boolean;
  save: (zone: Zone) => void;
}) {
  return (
    <Form
      title={zone ? "Gebiet bearbeiten" : "Gebiet hinzufügen"}
      busy={busy}
      submit={(data) =>
        save({
          id: zone?.id ?? crypto.randomUUID(),
          country: value(data, "country"),
          region: value(data, "region"),
          city: value(data, "city"),
          name: value(data, "name"),
          postalCode: value(data, "postal"),
          travelMinutes: number(data, "travel"),
          enabled: data.has("enabled"),
        })
      }
    >
      <TextField
        name="country"
        label="Land (ISO-Code)"
        value={zone?.country ?? "AT"}
      />
      <TextField
        name="region"
        label="Region / Bundesland"
        value={zone?.region ?? "Wien"}
      />
      <TextField name="city" label="Stadt" value={zone?.city ?? "Wien"} />
      <TextField name="name" label="Bezirk / Gebiet" value={zone?.name} />
      <TextField name="postal" label="Postleitzahl" value={zone?.postalCode} />
      <NumberField
        name="travel"
        label="Fahrt (Min.)"
        value={zone?.travelMinutes ?? 15}
        min={1}
        max={120}
      />
      <Check name="enabled" label="Aktiv" checked={zone?.enabled ?? true} />
    </Form>
  );
}

export function PizzaForm({
  pizza,
  busy,
  save,
}: {
  pizza?: Pizza;
  busy: boolean;
  save: (pizza: Pizza) => void;
}) {
  return (
    <Form
      title={pizza ? "Pizza bearbeiten" : "Pizza hinzufügen"}
      busy={busy}
      submit={(data) =>
        save({
          id: pizza?.id ?? crypto.randomUUID(),
          name: value(data, "name"),
          description: value(data, "description"),
          allergens: value(data, "allergens"),
          priceCents: number(data, "price", 100),
          prepMinutes: number(data, "prep"),
          enabled: data.has("enabled"),
        })
      }
    >
      <TextField name="name" label="Name" value={pizza?.name} />
      <TextField
        name="description"
        label="Beschreibung"
        value={pizza?.description}
        optional
      />
      <TextField name="allergens" label="Allergene" value={pizza?.allergens} />
      <NumberField
        name="price"
        label="Preis (€)"
        value={(pizza?.priceCents ?? 1200) / 100}
        min={0.01}
        max={1000}
        step={0.01}
      />
      <NumberField
        name="prep"
        label="Zubereitung (Min.)"
        value={pizza?.prepMinutes ?? 15}
        min={1}
        max={120}
      />
      <Check name="enabled" label="Aktiv" checked={pizza?.enabled ?? true} />
    </Form>
  );
}

export function KitchenForm({
  kitchen,
  settings,
  busy,
  save,
}: {
  kitchen?: Kitchen;
  settings: Settings;
  busy: boolean;
  save: (kitchen: Kitchen) => void;
}) {
  return (
    <Form
      title={kitchen ? "Restaurant bearbeiten" : "Restaurant hinzufügen"}
      busy={busy}
      submit={(data) =>
        save({
          id: kitchen?.id ?? crypto.randomUUID(),
          name: value(data, "name"),
          address: value(data, "address"),
          email: value(data, "email"),
          phone: value(data, "phone"),
          zoneIds: values(data, "zones"),
          pizzaIds: values(data, "pizzas"),
          quality: number(data, "quality"),
          capacity: number(data, "capacity"),
          commissionBps: number(data, "commission", 100),
          enabled: data.has("enabled"),
          accepting: data.has("accepting"),
          cash: data.has("cash"),
          stripeAccount: value(data, "stripe"),
          klarna: data.has("klarna"),
        })
      }
    >
      <TextField
        name="name"
        label="Firma des Verkäufers"
        value={kitchen?.name}
      />
      <TextField
        name="address"
        label="Geschäftsanschrift"
        value={kitchen?.address}
      />
      <TextField
        name="phone"
        label="Telefon"
        value={kitchen?.phone}
        type="tel"
      />
      <TextField
        name="email"
        label="E-Mail"
        value={kitchen?.email}
        type="email"
      />
      <NumberField
        name="quality"
        label="Interne Bewertung"
        value={kitchen?.quality ?? 75}
        min={0}
        max={100}
      />
      <NumberField
        name="capacity"
        label="Max. offene Bestellungen"
        value={kitchen?.capacity ?? 8}
        min={1}
        max={100}
      />
      <NumberField
        name="commission"
        label="Provision (%)"
        value={(kitchen?.commissionBps ?? 0) / 100}
        min={0}
        max={100}
        step={0.01}
      />
      <TextField
        name="stripe"
        label="Stripe-Konto (acct_…)"
        value={kitchen?.stripeAccount}
        optional
      />
      <Check name="enabled" label="Aktiv" checked={kitchen?.enabled ?? false} />
      <Check
        name="accepting"
        label="Nimmt Bestellungen an"
        checked={kitchen?.accepting ?? false}
      />
      <Check name="cash" label="Barzahlung" checked={kitchen?.cash ?? true} />
      <Check
        name="klarna"
        label="Klarna anbieten"
        checked={kitchen?.klarna ?? false}
      />
      <Choices
        title="Liefergebiete"
        name="zones"
        options={settings.zones}
        values={kitchen?.zoneIds ?? []}
      />
      <Choices
        title="Freigegebene Pizzen"
        name="pizzas"
        options={settings.menu}
        values={kitchen?.pizzaIds ?? []}
      />
    </Form>
  );
}
