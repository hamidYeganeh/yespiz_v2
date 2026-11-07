import type { Metadata } from "next";
import Link from "next/link";
import "../../../packages/ui/src/yespiz/base.css";

export const metadata: Metadata = {
  title: "yespiz · Partner",
  description: "yespiz · Pizza und Lieferung",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de-AT">
      <body>
        <header className="top">
          <div className="wrap top-inner">
            <Link href="/" className="wordmark">
              yespiz<span>.</span>
            </Link>
            <nav aria-label="Navigation">
              <Link href="/">Restaurant</Link>
              <Link href="/courier">Fahrer</Link>
            </nav>
            <span className="top-label">Partner</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
