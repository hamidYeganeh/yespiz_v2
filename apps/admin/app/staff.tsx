import { useState } from "react";
import {
  Alert,
  useAction,
  useQuery,
} from "../../../packages/ui/src/yespiz/client";
import type { Kitchen, User } from "../../../packages/ui/src/yespiz/client";
import { Choices, Form, TextField, value, values } from "./settings-forms";

export function Staff({ kitchens }: { kitchens: Kitchen[] }) {
  const query = useQuery<User[]>("admin", "/admin/staff");
  const action = useAction("admin", query.reload);
  const [created, setCreated] = useState("");
  const [editing, setEditing] = useState<string>();
  async function create(data: FormData) {
    const user = await action.run<User>("/admin/staff", {
      name: value(data, "name"),
      email: value(data, "email"),
      password: value(data, "password"),
      role: value(data, "role"),
      kitchenIds: values(data, "kitchens"),
    });
    if (user) setCreated(user.name + " wurde angelegt.");
  }
  async function update(user: User, data: FormData) {
    setCreated("");
    const updated = await action.run<User>(
      `/admin/staff/${user.id}`,
      {
        role: value(data, "role"),
        kitchenIds: values(data, "kitchens"),
        suspended: data.has("suspended"),
      },
      "PUT",
    );
    if (updated) {
      setEditing(undefined);
      setCreated("Zugriff für " + updated.name + " gespeichert.");
    }
  }
  return (
    <div className="grid">
      <div className="stack">
        <Alert>{action.error || query.error}</Alert>
        {created && (
          <p className="notice" role="status">
            {created}
          </p>
        )}
        <Form
          title="Mitarbeiterkonto anlegen"
          busy={action.busy}
          submit={(data) => void create(data)}
        >
          <TextField name="name" label="Name" />
          <TextField name="email" label="E-Mail" type="email" />
          <label>
            Passwort (mind. 12 Zeichen)
            <input name="password" type="password" minLength={12} required />
          </label>
          <label>
            Rolle
            <select name="role">
              <option value="kitchen">Restaurant</option>
              <option value="courier">Fahrer</option>
            </select>
          </label>
          <Choices
            title="Zugeordnete Restaurants"
            name="kitchens"
            options={kitchens}
            values={[]}
          />
        </Form>
      </div>
      <section className="panel stack">
        <h2>Mitarbeiter</h2>
        {!query.data && !query.error && (
          <p role="status">Mitarbeiter werden geladen …</p>
        )}
        {query.data?.length === 0 && <p>Keine Mitarbeiter vorhanden.</p>}
        {query.data?.map((user) => (
          <div className="stack" key={user.id}>
            <p>
              <strong>{user.name}</strong>
              <br />
              <span className="muted">
                {user.email} ·{" "}
                {user.role === "admin"
                  ? "Administration"
                  : user.role === "kitchen"
                    ? "Restaurant"
                    : "Fahrer"}
                {user.suspended ? " · Gesperrt" : ""}
              </span>
            </p>
            {user.role !== "admin" && (
              <div>
                <button
                  type="button"
                  aria-expanded={editing === user.id}
                  disabled={action.busy}
                  onClick={() =>
                    setEditing(editing === user.id ? undefined : user.id)
                  }
                >
                  {editing === user.id
                    ? "Bearbeitung schließen"
                    : "Zugriff bearbeiten"}
                </button>
              </div>
            )}
            {editing === user.id && (
              <Form
                title={`Zugriff für ${user.name}`}
                busy={action.busy}
                submit={(data) => void update(user, data)}
              >
                <label>
                  Rolle
                  <select name="role" defaultValue={user.role}>
                    <option value="kitchen">Restaurant</option>
                    <option value="courier">Fahrer</option>
                  </select>
                </label>
                <label className="check">
                  <input
                    name="suspended"
                    type="checkbox"
                    defaultChecked={user.suspended}
                  />
                  Konto sperren
                </label>
                <Choices
                  title="Zugeordnete Restaurants"
                  name="kitchens"
                  options={kitchens}
                  values={user.kitchenIds}
                />
                <p className="muted full">
                  Bei einer Änderung muss sich die Person erneut anmelden.
                </p>
              </Form>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
