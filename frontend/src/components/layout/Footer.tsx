import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function Footer() {
  return (
    <footer className="border-t border-olive-200 bg-olive-950 text-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <Logo size="md" light href="/" />
          <p className="mt-3 max-w-xs text-sm text-cream-300/80">
            Land intelligence for financial returns and climate impact.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div>
            <div className="font-medium text-cream-100">Product</div>
            <ul className="mt-3 space-y-2 text-cream-300/80">
              <li>
                <Link href="/discover" className="hover:text-cream-50">
                  Discover
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-cream-50">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/analyze" className="hover:text-cream-50">
                  Analyze
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-cream-100">Company</div>
            <ul className="mt-3 space-y-2 text-cream-300/80">
              <li>
                <a href="#" className="hover:text-cream-50">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-cream-50">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-olive-800 py-4 text-center text-xs text-cream-400/70">
        © {new Date().getFullYear()} GreenVest. Built for impact.
      </div>
    </footer>
  );
}
