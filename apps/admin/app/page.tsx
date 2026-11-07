"use client";

import { useState } from "react";
import {
  Alert,
  money,
  Portal,
  useAction,
  useQuery,
} from "../../../packages/ui/src/yespiz/client";
import type { Settings } from "../../../packages/ui/src/yespiz/client";
import { KitchenForm, PizzaForm, ZoneForm } from "./settings-forms";
import { Staff } from "./staff";
import { Operations } from "./operations";

export default function Page() {
  return (
    <main className="wrap page">
      <div className="heading">
        <p className="eyebrow">YESPIZ / VERWALTUNG</p>
        <h1>Administration</h1>
        <p>
          Liefergebiete, Speisekarte und Partner verwalten. Bestellungen und
          Meldungen im Blick behalten.
        </p>
      </div>
      <Portal role="admin">{() => <Admin />}</Portal>
    </main>
  );
}

function Admin() {
  const query = useQuery<Settings>("admin", "/admin/settings");
  const action = useAction("admin", query.reload);
  const [tab, setTab] = useState("Liefergebiete");
  const [saved, setSaved] = useState<Settings>();
  const [notice, setNotice] = useState("");
  const settings =
    query.data && (!saved || query.data.version > saved.version)
      ? query.data
      : saved;
  const tabs = [
    "Liefergebiete",
    "Menü",
    "Restaurants",
    "Konten",
    "Bestellungen",
  ];
  async function update(next: Settings) {
    setNotice("");
    const result = await action.run<Settings>("/admin/settings", next, "PUT");
    if (result) {
      setSaved(result);
      setNotice("Gespeichert · Version " + result.version);
    }
  }
  return (
    <>
      <nav className="row tabs" aria-label="Verwaltungsbereiche">
        {tabs.map((value) => (
          <button
            key={value}
            type="button"
            className="secondary"
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              setNotice("");
            }}
          >
            {value}
          </button>
        ))}
      </nav>
      <Alert>{query.error || action.error}</Alert>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {settings && tab === "Liefergebiete" && (
        <div className="grid" key={"zones-" + settings.version}>
          <ZoneForm
            busy={action.busy}
            save={(entry) =>
              void update({ ...settings, zones: [...settings.zones, entry] })
            }
          />
          <div className="stack">
            {settings.zones.map((zone) => (
              <details className="panel" key={zone.id}>
                <summary>
                  {zone.postalCode} {zone.city} · {zone.name} ({zone.country})
                </summary>
                <ZoneForm
                  zone={zone}
                  busy={action.busy}
                  save={(entry) =>
                    void update({
                      ...settings,
                      zones: settings.zones.map((item) =>
                        item.id === entry.id ? entry : item,
                      ),
                    })
                  }
                />
              </details>
            ))}
          </div>
        </div>
      )}
      {settings && tab === "Menü" && (
        <div className="grid" key={"menu-" + settings.version}>
          <PizzaForm
            busy={action.busy}
            save={(entry) =>
              void update({ ...settings, menu: [...settings.menu, entry] })
            }
          />
          <div className="stack">
            {settings.menu.map((pizza) => (
              <details className="panel" key={pizza.id}>
                <summary>
                  {pizza.name} · {money(pizza.priceCents)}
                </summary>
                <PizzaForm
                  pizza={pizza}
                  busy={action.busy}
                  save={(entry) =>
                    void update({
                      ...settings,
                      menu: settings.menu.map((item) =>
                        item.id === entry.id ? entry : item,
                      ),
                    })
                  }
                />
              </details>
            ))}
          </div>
        </div>
      )}
      {settings && tab === "Restaurants" && (
        <div className="grid" key={"kitchens-" + settings.version}>
          <KitchenForm
            settings={settings}
            busy={action.busy}
            save={(entry) =>
              void update({
                ...settings,
                kitchens: [...settings.kitchens, entry],
              })
            }
          />
          <div className="stack">
            {settings.kitchens.map((kitchen) => (
              <details className="panel" key={kitchen.id}>
                <summary>
                  {kitchen.name} · {kitchen.enabled ? "Aktiv" : "Pausiert"}
                </summary>
                <KitchenForm
                  settings={settings}
                  kitchen={kitchen}
                  busy={action.busy}
                  save={(entry) =>
                    void update({
                      ...settings,
                      kitchens: settings.kitchens.map((item) =>
                        item.id === entry.id ? entry : item,
                      ),
                    })
                  }
                />
              </details>
            ))}
          </div>
        </div>
      )}
      {settings && tab === "Konten" && <Staff kitchens={settings.kitchens} />}
      {tab === "Bestellungen" && <Operations />}
    </>
  );
}
