import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, User, LogIn, UserPlus, LayoutDashboard, LogOut, HelpCircle, Search, Compass, X, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import logoImg from "../../imports/c8f8ad87-0b32-4268-ba96-7d4a61b80241.png";

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
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setMenuOpen(false);
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

  const navClass = isHome && !scrolled
    ? "text-white/90 hover:text-white"
    : "text-gray-700 hover:text-gray-950";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isHome && !scrolled ? "bg-transparent" : "bg-white/90 backdrop-blur-xl shadow-sm"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">
          <Link to="/" className="flex items-center select-none shrink-0" aria-label="Voyara home">
            <img
              src={logoImg}
              alt="Voyara"
              className={`h-11 sm:h-12 w-auto object-contain transition-all duration-500 ${isHome && !scrolled ? "brightness-0 invert drop-shadow-md" : ""}`}
            />
          </Link>

          <div className={`hidden md:flex items-center gap-1 ${navClass}`}>
            <Link to="/" className="px-4 py-2 text-sm font-medium rounded-full transition-colors">Explore</Link>
            <a href={isHome ? "#listings-section" : "/#listings-section"} className="px-4 py-2 text-sm font-medium rounded-full transition-colors">Journeys</a>
            <a href={isHome ? "#stays-section" : "/#stays-section"} className="px-4 py-2 text-sm font-medium rounded-full transition-colors">Stays</a>
            <a href={isHome ? "#transport-section" : "/#transport-section"} className="px-4 py-2 text-sm font-medium rounded-full transition-colors">Transport</a>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && <NotificationBell />}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className={`flex items-center gap-2 rounded-full px-2 py-1.5 sm:px-3 transition-all duration-300 ${isHome && !scrolled ? "bg-white/15 border border-white/30 hover:bg-white/25" : "bg-white border border-gray-200 hover:shadow-md"}`}
              >
                <Menu className={`w-4 h-4 ${isHome && !scrolled ? "text-white" : "text-gray-700"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isAuthenticated ? "bg-gradient-to-br from-emerald-700 to-emerald-500" : "bg-gray-700"}`}>
                  <User className="w-4 h-4 text-white" />
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-14 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 w-72 z-50 border border-gray-200/80 overflow-hidden">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-4 border-b border-gray-100">
                        <p className="text-xs text-gray-400">Welcome back, {firstName}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{user?.email}</p>
                        <div className="flex gap-2 mt-2">
                          {isAdmin && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Admin</span>}
                          {isTourist && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Traveler</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4 text-emerald-600" /> Go to Dashboard
                        </Link>
                      )}
                      {isTourist && (
                        <>
                          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                            <Compass className="w-4 h-4 text-emerald-600" /> Explore trips
                          </Link>
                          <Link to="/tourist/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                            <LayoutDashboard className="w-4 h-4 text-emerald-600" /> My journeys
                          </Link>
                        </>
                      )}
                      <Link to="/help" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
                        <HelpCircle className="w-4 h-4 text-gray-400" /> Help Center
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
                        <LogOut className="w-4 h-4 text-gray-400" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                        <LogIn className="w-4 h-4 text-emerald-600" /> Log in
                      </Link>
                      <Link to="/login?mode=signup" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                        <UserPlus className="w-4 h-4 text-gray-400" /> Create an account
                      </Link>
                      <Link to="/help" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100">
                        <HelpCircle className="w-4 h-4 text-gray-400" /> Help Center
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden absolute left-4 right-4 top-[70px] rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200 p-2">
            <Link to="/" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
              Explore <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <a href={isHome ? "#listings-section" : "/#listings-section"} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
              Journeys <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
            <a href={isHome ? "#stays-section" : "/#stays-section"} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
              Stays <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
            <a href={isHome ? "#transport-section" : "/#transport-section"} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
              Transport <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
