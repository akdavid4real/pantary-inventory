import { useEffect, useRef, useState } from "react";
import { Header } from "../../components/Header";
import { Loader } from "../../components/Loader";
import { StatsBar } from "../../components/StatsBar";
import { usePageAnimations } from "../../hooks/usePageAnimations";
import { CookingSection } from "../../sections/CookingSection";
import { ChefFavourSection } from "../../sections/ChefFavourSection";
import { ChefStorySection } from "../../sections/ChefStorySection";
import { FeatureRailSection } from "../../sections/FeatureRailSection";
import { FooterSection } from "../../sections/FooterSection";
import { HeroSection } from "../../sections/HeroSection";
import { MessageSection } from "../../sections/MessageSection";
import { NutritionSection } from "../../sections/NutritionSection";

export function LandingPage() {
  const rootRef = useRef<HTMLElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setLoaded(true), 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  usePageAnimations({ rootRef, horizontalRef });

  return (
    <main ref={rootRef} className={loaded ? "is-loaded" : ""}>
      <Loader />
      <Header />
      <HeroSection />
      <StatsBar />
      <MessageSection />
      <ChefFavourSection />
      <ChefStorySection />
      <FeatureRailSection horizontalRef={horizontalRef} />
      <NutritionSection />
      <CookingSection />
      <FooterSection />
    </main>
  );
}
