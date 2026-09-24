import { useEffect, useRef, useState } from "react";
import { Compass, HelpCircle, LayoutDashboard, LogIn, LogOut, Menu, User, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import logoImg from "../../imports/c8f8ad87-0b32-4268-ba96-7d4a61b80241.png";

const travelLinks = [
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Local Guides", href: "/guides", icon: User },
  { label: "Plan a Trip", href: "/tourist/plan", icon: Compass },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.roles.includes("ADMIN");
  const isTourist = user?.roles.includes("TOURIST");
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "Traveler";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setMenuOpen(false); }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => { logout(); setMenuOpen(false); navigate("/", { replace: true }); };

  return <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex h-16 items-center justify-between">
    <Link to="/" className="shrink-0 select-none"><img src={logoImg} alt="Voyara" className="h-11 w-auto object-contain" /></Link>
    <div className="hidden items-center gap-1 md:flex">{travelLinks.map(({ label, href }) => <Link key={href} to={href} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900">{label}</Link>)}<Link to="/compare-packages" className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900">Compare</Link></div>
    <div className="flex items-center gap-2">{isAuthenticated && <NotificationBell />}<div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Open account menu" className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 transition hover:shadow-md"><Menu className="h-4 w-4 text-gray-700" /><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF385C] to-[#E31C5F]"><User className="h-4 w-4 text-white" /></div></button>
      {menuOpen && <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl">
        <div className="px-4 pb-2 pt-2"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Travel with Voyara</p></div>
        <div className="border-y border-gray-100 py-1 md:hidden">{travelLinks.map(({ label, href, icon: Icon }) => <Link key={href} to={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Icon className="h-4 w-4 text-gray-400" />{label}</Link>)}<Link to="/compare-packages" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Compass className="h-4 w-4 text-gray-400" />Compare packages</Link></div>
        {isAuthenticated ? <><div className="px-4 py-3"><p className="text-xs text-gray-400">Welcome back, {firstName}</p><p className="truncate text-sm font-semibold text-gray-800">{user?.email}</p>{isAdmin && <span className="mt-1 inline-block rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">Admin</span>}{isTourist && <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Tourist</span>}</div>{isTourist && <Link to="/tourist/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-gray-50"><LayoutDashboard className="h-4 w-4" />My bookings</Link>}{isAdmin && <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-gray-50"><LayoutDashboard className="h-4 w-4" />Admin dashboard</Link>}<Link to="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><HelpCircle className="h-4 w-4 text-gray-400" />Help Center</Link><button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"><LogOut className="h-4 w-4 text-gray-400" />Sign Out</button></> : <><Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"><LogIn className="h-4 w-4 text-gray-500" />Log in</Link><Link to="/login?mode=signup" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><UserPlus className="h-4 w-4 text-gray-400" />Sign up</Link><Link to="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><HelpCircle className="h-4 w-4 text-gray-400" />Help Center</Link></>}
      </div>}
    </div></div>
  </div></div></nav>;
}