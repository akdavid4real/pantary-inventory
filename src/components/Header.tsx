import { Brand } from "./Brand";

export function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Pantry-to-Plate home">
        <Brand />
      </a>
      <nav aria-label="Primary navigation">
        <a href="#features">Features</a>
        <a href="#nutrition">Nutrition</a>
        <a href="#cook">Cooking</a>
      </nav>
    </header>
  );
}

