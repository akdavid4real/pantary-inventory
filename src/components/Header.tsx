import { assets } from "../data/assets";

export function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Pantry-to-Plate home">
        <img src={assets.logo} alt="" />
        <span>Pantry-to-Plate</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#features">Features</a>
        <a href="#nutrition">Nutrition</a>
        <a href="#cook">Cooking</a>
      </nav>
    </header>
  );
}

