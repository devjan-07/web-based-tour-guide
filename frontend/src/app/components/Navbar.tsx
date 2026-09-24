import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Menu,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  HelpCircle,
  Compass,
  X,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import logoImg from "../../imports/c8f8ad87-0b32-4268-ba96-7d4a61b80241.png";

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Journeys", href: "#listings-section" },
  { label: "Stays", href: "#stays-section" },
  { label: "Transport", href: "#transport-section" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHome = location.pathname === "/";
  const isAdmin = user?.roles.includes("ADMIN");
  const isTourist = user?.roles.includes("TOURIST");
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "Traveler";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 42);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/", { replace: true });
  };

  const goToAnchor = (href: string) => {
    if (href.startsWith("/")) {
      navigate(href);
      return;
    }

    if (href === "#top") {
      if (isHome) window.scrollTo({ top: 0, behavior: "smooth" });
      else navigate("/");
      return;
    }

    if (isHome) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/${href}`);
    }
  };

  const overHero = isHome && !scrolled;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 px-3 sm:px-5 lg:px-7 pointer-events-none transition-all duration-700 ${overHero ? "pt-4 sm:pt-5" : "pt-2 sm:pt-3"}`}
    >
      <div
        className={`mx-auto max-w-[1440px] pointer-events-auto transition-all duration-700 ease-out ${overHero
          ? "bg-black/10 border border-white/15"
          : "bg-white/90 border border-black/5 shadow-[0_12px_40px_rgba(15,23,42,0.10)]"
        } backdrop-blur-2xl rounded-full`}
      >
        <div className="h-[68px] sm:h-[74px] px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center shrink-0 group" aria-label="Voyara home">
            <img
              src={logoImg}
              alt="Voyara"
              className={`h-9 sm:h-10 lg:h-11 w-auto object-contain transition-all duration-500 group-hover:scale-[1.03] ${overHero ? "brightness-0 invert drop-shadow-lg" : ""}`}
            />
          </Link>

          <div className={`hidden lg:flex items-center gap-1 ${overHero ? "text-white" : "text-slate-700"}`}>
            {navItems.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => goToAnchor(item.href)}
                className="group relative px-4 py-2.5 text-[13px] font-semibold tracking-wide transition-colors"
              >
                <span className="relative z-10">{item.label}</span>
                <span
                  className={`absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${overHero ? "bg-white" : "bg-emerald-700"}`}
                />
                {index === 0 && <span className="absolute -right-0.5 top-2 h-1 w-1 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to={isTourist ? "/tourist/dashboard" : "/explore"}
              className={`hidden sm:inline-flex items-center gap-2 rounded-full px-4 lg:px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 hover:-translate-y-0.5 ${overHero
                ? "bg-white text-slate-900 hover:bg-white/90 shadow-lg"
                : "bg-emerald-800 text-white hover:bg-emerald-700 shadow-md"
              }`}
            >
              {isTourist ? "My journey" : "Start exploring"}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {isAuthenticated && <NotificationBell />}

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className={`flex items-center gap-2 rounded-full p-1.5 transition-all duration-300 ${overHero
                  ? "bg-white/12 border border-white/20 hover:bg-white/20"
                  : "bg-white border border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`hidden sm:block px-1.5 text-xs font-semibold ${overHero ? "text-white" : "text-slate-700"}`}>
                  {isAuthenticated ? firstName : "Menu"}
                </span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${isAuthenticated ? "bg-emerald-700" : overHero ? "bg-white/15" : "bg-slate-800"}`}>
                  <Menu className={`w-4 h-4 ${overHero && !isAuthenticated ? "text-white" : "text-white"}`} />
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-14 w-[290px] overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.20)] backdrop-blur-2xl">
                  {isAuthenticated ? (
                    <>
                      <div className="border-b border-slate-100 px-5 py-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Welcome back</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{firstName}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                        <div className="mt-3 flex gap-2">
                          {isAdmin && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Admin</span>}
                          {isTourist && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Traveler</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <Link to="/dashboard" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                          <LayoutDashboard className="w-4 h-4 text-emerald-700" /> Go to Dashboard
                        </Link>
                      )}
                      {isTourist && (
                        <>
                          <Link to="/explore" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                            <Compass className="w-4 h-4 text-emerald-700" /> Explore trips
                          </Link>
                          <Link to="/tourist/dashboard" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                            <LayoutDashboard className="w-4 h-4 text-emerald-700" /> My journeys
                          </Link>
                        </>
                      )}
                      <Link to="/help" className="flex items-center gap-3 border-t border-slate-100 px-5 py-3.5 text-sm text-slate-700 hover:bg-slate-50">
                        <HelpCircle className="w-4 h-4 text-slate-400" /> Help Center
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 border-t border-slate-100 px-5 py-3.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                        <LogOut className="w-4 h-4 text-slate-400" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-5 py-4 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">Your next journey starts here.</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">Save plans, manage bookings and keep every trip in one place.</p>
                      </div>
                      <Link to="/login" className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        <LogIn className="w-4 h-4 text-emerald-700" /> Log in
                      </Link>
                      <Link to="/login?mode=signup" className="flex items-center gap-3 px-5 py-3.5 text-sm text-slate-700 hover:bg-slate-50">
                        <UserPlus className="w-4 h-4 text-slate-400" /> Create an account
                      </Link>
                      <Link to="/help" className="flex items-center gap-3 border-t border-slate-100 px-5 py-3.5 text-sm text-slate-700 hover:bg-slate-50">
                        <HelpCircle className="w-4 h-4 text-slate-400" /> Help Center
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-white/10 px-2 pb-2 pt-2">
            <div className={`rounded-[20px] p-1 ${overHero ? "bg-black/10" : "bg-slate-50"}`}>
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setMenuOpen(false); goToAnchor(item.href); }}
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold ${overHero ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-white"}`}
                >
                  {item.label}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
