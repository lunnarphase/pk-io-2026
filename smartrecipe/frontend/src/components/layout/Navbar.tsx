import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { to: "/suggestions", label: "Sugestie" },
  { to: "/pantry", label: "Spiżarnia" },
  { to: "/recipes", label: "Przepisy" },
  { to: "/shopping-list", label: "Zakupy" },
  { to: "/external", label: "Import" },
] as const;

function navLinkClass(isActive: boolean) {
  return isActive ? "app-nav__link app-nav__link--active" : "app-nav__link";
}

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const drawerId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(location.pathname);
  const open = menuOpen && menuPath === location.pathname;

  function setOpen(next: boolean) {
    if (next) {
      setMenuPath(location.pathname);
      setMenuOpen(true);
      return;
    }
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!open) {
      document.body.classList.remove("app-nav--menu-open");
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.classList.add("app-nav--menu-open");
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("app-nav--menu-open");
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <NavLink
          className="app-nav__brand"
          to="/suggestions"
          onClick={() => setOpen(false)}
        >
          SmartRecipe
        </NavLink>

        <nav className="app-nav__links" aria-label="Główna nawigacja">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-nav__actions">
          <button
            type="button"
            className="app-nav__logout app-nav__logout--desktop"
            onClick={handleLogout}
          >
            Wyloguj
          </button>
          <button
            type="button"
            className="app-nav__menu-btn"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen(!open)}
          >
            <span className="app-nav__sr-only">
              {open ? "Zamknij menu" : "Otwórz menu"}
            </span>
            {open ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <>
              {open ? (
                <button
                  type="button"
                  className="app-nav__backdrop"
                  aria-label="Zamknij menu"
                  onClick={() => setOpen(false)}
                />
              ) : null}

              <nav
                id={drawerId}
                className="app-nav__drawer"
                aria-label="Menu mobilne"
                aria-hidden={!open}
                data-open={open}
                inert={open ? undefined : true}
              >
                <div className="app-nav__drawer-head">
                  <span className="app-nav__drawer-title">Menu</span>
                  <button
                    type="button"
                    className="app-nav__drawer-close"
                    aria-label="Zamknij menu"
                    onClick={() => setOpen(false)}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>

                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => navLinkClass(isActive)}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ))}

                <button
                  type="button"
                  className="app-nav__logout"
                  onClick={handleLogout}
                >
                  Wyloguj
                </button>
              </nav>
            </>,
            document.body,
          )
        : null}
    </header>
  );
}
