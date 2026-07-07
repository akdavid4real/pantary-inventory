import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Loader } from "./components/Loader";
import { StatsBar } from "./components/StatsBar";
import { usePageAnimations } from "./hooks/usePageAnimations";
import { CookingSection } from "./sections/CookingSection";
import { FeatureRailSection } from "./sections/FeatureRailSection";
import { FooterSection } from "./sections/FooterSection";
import { HeroSection } from "./sections/HeroSection";
import { MessageSection } from "./sections/MessageSection";
import { NutritionSection } from "./sections/NutritionSection";

function App() {
  const rootRef = useRef<HTMLElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLoaded(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  usePageAnimations({ rootRef, horizontalRef });

  return (
    <main ref={rootRef} className={loaded ? "is-loaded" : ""}>
      <Loader />
      <Header />
      <HeroSection />
      <StatsBar />
      <MessageSection />
      <FeatureRailSection horizontalRef={horizontalRef} />
      <NutritionSection />
      <CookingSection />
      <FooterSection />
    </main>
  );
}

export default App;
