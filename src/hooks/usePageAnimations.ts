import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type UsePageAnimationsArgs = {
  rootRef: RefObject<HTMLElement | null>;
  horizontalRef: RefObject<HTMLDivElement | null>;
};

export function usePageAnimations({ rootRef, horizontalRef }: UsePageAnimationsArgs) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      gsap.set(root.querySelectorAll(".split-part, .reveal-up, .scene-card, .hero-plate"), {
        clearProps: "all",
        opacity: 1,
        y: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(".split-part", { yPercent: 115, rotate: 4 });
      gsap.set(".reveal-up", { opacity: 0, y: 36 });
      gsap.set(".hero-plate", { opacity: 0, scale: 0.74, rotate: -12, y: 80 });
      gsap.set(".float-chip", { opacity: 0, scale: 0.82, y: 24 });

      const intro = gsap.timeline({ delay: 0.1 });
      intro
        .to(".loader-bar span", { scaleX: 1, duration: 0.9, ease: "power2.inOut" })
        .to(".loader", { yPercent: -105, duration: 0.85, ease: "power4.inOut" })
        .to(".hero-title .split-part", { yPercent: 0, rotate: 0, stagger: 0.018, duration: 0.9, ease: "power4.out" }, "-=0.18")
        .to(".hero-tag .split-part", { yPercent: 0, rotate: 0, stagger: 0.026, duration: 0.75, ease: "power3.out" }, "-=0.55")
        .to(".hero-plate", { opacity: 1, scale: 1, rotate: 0, y: 0, duration: 1.15, ease: "elastic.out(1, 0.72)" }, "-=0.65")
        .to(".reveal-up", { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "power3.out" }, "-=0.5")
        .to(".float-chip", { opacity: 1, scale: 1, y: 0, stagger: 0.08, duration: 0.56, ease: "back.out(1.8)" }, "-=0.45");

      gsap.to(".hero-stage", {
        rotate: 5,
        scale: 0.88,
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(".message-word .split-part", {
        color: "#12372A",
        stagger: 0.22,
        ease: "none",
        scrollTrigger: {
          trigger: ".message-section",
          start: "top 68%",
          end: "bottom 38%",
          scrub: true,
        },
      });

      gsap.set(".text-scroll", {
        clipPath: "inset(0 100% 0 0)",
        opacity: 1,
        x: (index) => [-28, 28, -22, 22][index] ?? 0,
        y: (index) => [16, 4, 0, 8][index] ?? 0,
        rotate: (index) => [-5, 4, -3, 5][index] ?? 0,
        scale: 0.98,
      });

      const messageTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".message-section",
          start: "top 68%",
          end: "top -8%",
          scrub: 1.2,
        },
      });

      messageTl.to(".text-scroll", {
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
        x: 0,
        y: 0,
        rotate: (index) => [-2.5, 2, -1.5, 2.5][index] ?? 0,
        scale: 1,
        stagger: 0.52,
        duration: 1.05,
        ease: "circ.inOut",
      });

      const rail = horizontalRef.current;
      if (rail && window.matchMedia("(min-width: 900px)").matches) {
        const travel = rail.scrollWidth - window.innerWidth + window.innerWidth * 0.22;
        gsap.to(rail, {
          x: -travel,
          ease: "none",
          scrollTrigger: {
            trigger: ".feature-rail-section",
            start: "top top",
            end: `+=${travel + 2200}`,
            scrub: 1.8,
            pin: true,
            anticipatePin: 1,
          },
        });

        gsap.to(".rail-title-row", {
          xPercent: -28,
          ease: "none",
          scrollTrigger: {
            trigger: ".feature-rail-section",
            start: "top top",
            end: `+=${travel + 1800}`,
            scrub: 1.4,
          },
        });
      }

      gsap.utils.toArray<HTMLElement>(".scene-card").forEach((card) => {
        gsap.from(card, {
          opacity: 0,
          y: 80,
          rotate: gsap.utils.random(-6, 6),
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });

      if (window.matchMedia("(min-width: 768px)").matches) {
        gsap.fromTo(
          ".cook-image-mask",
          { clipPath: "circle(8% at 50% 50%)" },
          {
            clipPath: "circle(75% at 50% 50%)",
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: ".cook-pin",
              start: "top top",
              end: "230% top",
              scrub: 2,
              pin: true,
            },
          },
        );
      }

      gsap.to(".spin-ring", {
        rotate: 360,
        duration: 22,
        ease: "none",
        repeat: -1,
      });

      gsap.fromTo(
        ".footer-scene",
        { clipPath: "circle(12% at 50% 0%)" },
        {
          clipPath: "circle(135% at 50% 50%)",
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: ".footer-scene",
            start: "top 76%",
            end: "top 18%",
            scrub: 1.2,
          },
        },
      );

      gsap.to(".footer-marquee", {
        xPercent: -50,
        duration: 18,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".footer-orbit img", {
        y: (index) => [-24, 20, -16][index] ?? 0,
        rotate: (index) => [-7, 6, 4][index] ?? 0,
        duration: 3.4,
        stagger: 0.3,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, [rootRef, horizontalRef]);
}
