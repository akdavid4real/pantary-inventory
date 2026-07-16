// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("exposes a visible sign-out action", () => {
    const onSignOut = vi.fn();
    render(<Sidebar active="Home" onSelect={vi.fn()} onSignOut={onSignOut} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
