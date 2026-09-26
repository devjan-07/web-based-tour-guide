import { useEffect, useRef, useState } from "react";
import { Compass, HelpCircle, LayoutDashboard, LogIn, LogOut, Menu, User, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import logoImg from "../../imports/c8f8ad87-0b32-4268-ba96-7d4a61b80241.png";

const travelLinks = [
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Local Guides", href: "/guides", icon: User },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.roles.includes("ADMIN");
  const isTourist = user?.roles.includes("TOURIST");
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "Traveler";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setMenuOpen(false);
    }

    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Link to="/" className="shrink-0 select-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2" aria-label="Voyara home">
            <img src={logoImg} alt="Voyara" className="h-10 w-auto object-contain sm:h-11" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {travelLinks.map(({ label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    active ? "text-gray-950" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                  }`}
                >
                  {label}
                  {active && <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-rose-500" />}
                </Link>
              );
            })}
            <Link
              to="/compare-packages"
              aria-current={isActive("/compare-packages") ? "page" : undefined}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                isActive("/compare-packages") ? "bg-gray-100 text-gray-950" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
              }`}
            >
              Compare
            </Link>
            <Link
              to="/tourist/plan"
              className="ml-2 inline-flex items-center rounded-full bg-gray-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800"
            >
              Plan a trip
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-gray-300 hover:shadow-md sm:px-3"
              >
                <Menu className="h-4 w-4 text-gray-700" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F]">
                  <User className="h-4 w-4 text-white" />
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-14 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl">
                  <div className="px-4 pb-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Travel with Voyara</p>
                  </div>

                  <div className="border-y border-gray-100 py-1 md:hidden">
                    {travelLinks.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        to={href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition ${
                          isActive(href) ? "bg-rose-50 text-rose-700" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 text-gray-400" />
                        {label}
                      </Link>
                    ))}
                    <Link
                      to="/compare-packages"
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition ${
                        isActive("/compare-packages") ? "bg-rose-50 text-rose-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Compass className="h-4 w-4 text-gray-400" />
                      Compare packages
                    </Link>
                    <Link
                      to="/tourist/plan"
                      onClick={() => setMenuOpen(false)}
                      className="mx-3 my-2 flex items-center justify-center rounded-xl bg-gray-950 px-4 py-3 text-sm font-bold text-white hover:bg-gray-800"
                    >
                      Plan a trip
                    </Link>
                  </div>

                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3">
                        <p className="text-xs text-gray-400">Welcome back, {firstName}</p>
                        <p className="truncate text-sm font-semibold text-gray-800">{user?.email}</p>
                        {isAdmin && <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">Admin</span>}
                        {isTourist && <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Tourist</span>}
                      </div>

                      {isTourist && (
                        <Link
                          to="/tourist/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          My bookings
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-gray-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin dashboard
                        </Link>
                      )}

                      <Link
                        to="/help"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        Help Center
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 text-gray-400" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <LogIn className="h-4 w-4 text-gray-500" />
                        Log in
                      </Link>
                      <Link
                        to="/login?mode=signup"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <UserPlus className="h-4 w-4 text-gray-400" />
                        Sign up
                      </Link>
                      <Link
                        to="/help"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        Help Center
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
