import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header${menuOpen ? " site-header--open" : ""}`}>
      <a className="brand" href="#top" aria-label="Pantry-to-Plate home">
        <Brand />
      </a>

      <button
        type="button"
        className="site-header-toggle"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <nav id="primary-navigation" aria-label="Primary navigation">
        <a href="#features" onClick={closeMenu}>Features</a>
        <a href="#nutrition" onClick={closeMenu}>Nutrition</a>
        <a href="#cook" onClick={closeMenu}>Cooking</a>
        <span className="site-header-auth">
          <a className="site-header-login" href="/login" onClick={closeMenu}>Log in</a>
          <a className="site-header-signup" href="/sign-up" onClick={closeMenu}>Sign up</a>
        </span>
      </nav>
    </header>
  );
}

