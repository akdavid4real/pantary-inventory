// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { FoodScan } from "./FoodScan";

describe("FoodScan", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
  });

  it("offers mobile camera capture and keeps analysis disabled until a photo is ready", () => {
    render(<FoodScan onNavigate={vi.fn()} />);

    const input = screen.getByLabelText("Take or upload photo") as HTMLInputElement;
    expect(input.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp");
    expect(input.getAttribute("capture")).toBe("environment");
    expect((screen.getByRole("button", { name: "Analyze this food" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
