"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useTheme } from "../contexts/ThemeContext"
import { VoiceCommandButton } from "./VoiceCommandButton"

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="navbar bg-base-100 shadow-lg px-2 sm:px-4">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabindex="0" role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabindex="0" className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li>
              <Link to="/services">{t("nav.services")}</Link>
            </li>
            <li>
              <Link to="/about">{t("nav.about")}</Link>
            </li>
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-lg sm:text-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
          <span className="hidden sm:inline">{t("nav.brand")}</span>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link to="/services" className="btn btn-ghost">
              {t("nav.services")}
            </Link>
          </li>
          <li>
            <Link to="/about" className="btn btn-ghost">
              {t("nav.about")}
            </Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        {/* Language toggle */}
        <button onClick={toggleLanguage} className="btn btn-ghost btn-circle mr-2">
          {language === "en" ? "عربي" : "English"}
        </button>

        {/* Theme toggle */}
        <label className="swap swap-rotate mr-4">
          <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
          <svg className="swap-off h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg className="swap-on h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>

        {isAuthenticated && (
          <div className="mr-2">
            <VoiceCommandButton />
          </div>
        )}

        {isAuthenticated && (
          <Link
            to="/emergency"
            className="btn btn-error btn-circle mr-2 animate-pulse shadow-lg border-2 border-error"
            title={t("emergency.alert")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </Link>
        )}

        {isAuthenticated ? (
          <div className="dropdown dropdown-end">
            <div tabindex="0" role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </span>
              </div>
            </div>
            <ul
              tabindex="0"
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li>
                <Link to="/profile" className="justify-between">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className={`btn btn-ghost btn-sm sm:btn-md text-xs sm:text-sm mr-2 ${
                location.pathname === "/login" ? "btn-active" : ""
              }`}
            >
              {t("nav.login")}
            </Link>
            <Link
              to="/signup"
              className={`btn btn-primary btn-sm sm:btn-md text-xs sm:text-sm ${
                location.pathname === "/signup" ? "btn-active" : ""
              }`}
            >
              <span className="hidden sm:inline">{t("nav.signup")}</span>
              <span className="sm:hidden">{t("nav.signup.mobile", "Join us!")}</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default Navbar
