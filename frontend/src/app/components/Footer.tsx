import { Globe } from "lucide-react";
import { Link } from "react-router";
import logoImg from "../../imports/c8f8ad87-0b32-4268-ba96-7d4a61b80241.png";

const footerLinks = [
  { title: "Explore", links: [["Destinations", "/explore"], ["Tour packages", "/explore"], ["Local guides", "/guides"], ["Plan a trip", "/tourist/plan"]] },
  { title: "Your trip", links: [["My trip", "/tourist/my-trip"], ["My bookings", "/tourist/dashboard"], ["Help Center", "/help"]] },
  { title: "For partners", links: [["List a tour", "/list-tour"], ["Partner access", "/login"]] },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {footerLinks.map(({ title, links }) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-bold text-gray-900">{title}</h4>
              <ul className="space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-sm text-gray-500 transition-colors hover:text-gray-900 hover:underline">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Voyara" className="h-10 w-auto object-contain" />
            <span className="text-sm text-gray-400">© 2026 Voyara. Travel with confidence.</span>
          </div>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Sitemap"].map(item => <span key={item} className="text-sm text-gray-500">{item}</span>)}
            <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"><Globe className="h-4 w-4" /> EN</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
