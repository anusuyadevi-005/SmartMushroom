import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Heart, ShoppingBasket, Home, LayoutDashboard,
  User, Package, Navigation, ClipboardList, LogOut,
  PlusSquare, Thermometer, Settings
} from "lucide-react";
import api from "../services/api";
import { getCart } from "../services/cartService";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPicture, setUserPicture] = useState("");
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const ref = useRef(null);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setUserName("");
        setUserPicture("");
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUserName(res.data.name || "User");
        setUserPicture(res.data.picture || "");
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };

    const handleStorageChange = () => {
      const cart = getCart();
      setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));
    };

    fetchUserData();
    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleStorageChange);
    window.addEventListener('profileUpdated', fetchUserData);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
      window.removeEventListener('profileUpdated', fetchUserData);
    };
  }, [token]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to} style={link} className="flex items-center gap-2 group px-3 py-2 rounded-xl transition-all duration-300 hover:bg-emerald-500/20 active:scale-95 shrink-0">
      <Icon className="w-5 h-5 text-emerald-50 group-hover:text-white transition-colors" />
      <span className="text-sm font-bold text-emerald-50 group-hover:text-white transition-colors whitespace-nowrap">
        {label}
      </span>
    </Link>
  );

  return (
    <nav className="flex justify-between items-center px-4 md:px-6 py-4 bg-[#1b4332] text-white shadow-lg sticky top-0 z-[100] transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group shrink-0">
        <div className="bg-emerald-600 p-2 rounded-xl shadow-inner group-hover:rotate-12 transition-transform">
          <ShoppingCart className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-50 to-emerald-300 hidden sm:inline">
          AgroSense
        </span>
      </Link>

      {/* Navigation Links - Scrollable on small screens */}
      <div className="flex-1 flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar px-2 md:px-4 justify-start md:justify-center">
        <NavItem to="/" icon={Home} label="Home" />
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

        {role === "admin" && (
          <>
            <NavItem to="/batch" icon={PlusSquare} label="Create Batch" />
            <NavItem to="/environment" icon={Thermometer} label="Environment" />
            <NavItem to="/orders" icon={ClipboardList} label="Orders" />
            <NavItem to="/stock-management" icon={Package} label="Stock" />
          </>
        )}

        <NavItem to="/products" icon={Package} label="Shop" />

        {role !== "admin" && <NavItem to="/track" icon={Navigation} label="Track Order" />}
        {role === "user" && <NavItem to="/myorders" icon={ClipboardList} label="My Orders" />}

        {role === "user" && (
          <Link to="/wishlist" style={link} className="flex items-center gap-2 group px-3 py-2 rounded-xl hover:bg-emerald-500/20 transition-all shrink-0">
            <Heart className="w-5 h-5 text-emerald-50 group-hover:text-red-400 transition-colors" />
            <span className="text-sm font-bold text-emerald-50 group-hover:text-white hidden xl:inline">Wishlist</span>
          </Link>
        )}

        {token && role !== "admin" && (
          <Link to="/cart" style={link} className="flex items-center gap-2 group px-3 py-2 rounded-xl hover:bg-emerald-500/20 transition-all shrink-0">
            <div className="relative">
              <ShoppingBasket className="w-5 h-5 text-emerald-50 group-hover:text-emerald-200" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-[#1b4332]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-emerald-50 group-hover:text-white hidden xl:inline">Cart</span>
          </Link>
        )}
      </div>

      {/* Account Menu - Kept outside scrollable area to prevent clipping */}
      <div ref={ref} className="relative ml-2 pl-2 border-l border-emerald-800/50 shrink-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-emerald-100 hover:bg-white text-[#1b4332] py-2 px-3 rounded-2xl transition-all duration-300 font-bold text-sm shadow-md hover:shadow-emerald-900/40 active:scale-95 group"
        >
          {token && userPicture ? (
            <div className="w-7 h-7 rounded-full border-2 border-emerald-600 overflow-hidden group-hover:rotate-6 transition-transform shadow-sm">
              <img src={userPicture} alt="User" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="bg-emerald-600 rounded-full p-1 group-hover:rotate-12 transition-transform">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="max-w-[100px] truncate">
            {token ? (userName || "Account") : "Sign In"}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 p-4 transform origin-top animate-navbar-popup z-50">
            <div className="flex flex-col gap-1">
              {token ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-3 bg-emerald-50/50 rounded-2xl mb-3">
                    {userPicture ? (
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0">
                        <img src={userPicture} alt="User" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-emerald-800/40 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                      <p className="text-sm font-black text-emerald-900 truncate">{userName || "Valued Customer"}</p>
                      <p className="text-[9px] font-black text-white bg-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tighter inline-block mt-1">{role}</p>
                    </div>
                  </div>
                  <MenuLink to="/profile" icon={User} label="My Profile" onClick={() => setOpen(false)} />
                  {role === "admin" && <MenuLink to="/admindashboard" icon={Settings} label="Admin Dashboard" onClick={() => setOpen(false)} />}
                  {role === "admin" && <MenuLink to="/stock-management" icon={Package} label="Stock Management" onClick={() => setOpen(false)} />}
                  {role === "user" && <MenuLink to="/myorders" icon={ClipboardList} label="My Orders" onClick={() => setOpen(false)} />}
                  <div className="my-2 border-t border-gray-50"></div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <MenuLink to="/login" icon={User} label="Sign In" onClick={() => setOpen(false)} />
                  <MenuLink to="/signup" icon={User} label="Create Account" onClick={() => setOpen(false)} />
                  <div className="p-3 bg-emerald-50 rounded-xl mt-3">
                    <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                      Admins: Log in with staff credentials for full harvest control.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes navbar-popup {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-navbar-popup { animation: navbar-popup 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  );
}

const MenuLink = ({ to, icon: Icon, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 text-gray-700 font-semibold text-sm rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all"
  >
    <Icon className="w-4 h-4" /> {label}
  </Link>
);

const link = {
  textDecoration: "none",
  color: "inherit"
};

export default Navbar;
