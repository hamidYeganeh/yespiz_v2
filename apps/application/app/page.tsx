import Image from "next/image";
import { Checkout } from "./checkout";

export default function Page() {
  return (
    <main className="wrap page">
      <section className="grid hero">
        <div className="hero-copy">
          <p className="eyebrow">PIZZA · LIEFERUNG</p>
          <h1>
            Dein Abend.
            <br />
            <em>Deine Pizza.</em>
          </h1>
          <p>
            Wähle deine Pizza, prüfe dein Liefergebiet und verfolge deine
            Bestellung bis zur Tür.
          </p>
          <span className="badge">Kostenlose Lieferung</span>
        </div>
        <Image src="/pizza-art.svg" alt="" width={510} height={365} preload />
      </section>
      <Checkout />
    </main>
  );
}
