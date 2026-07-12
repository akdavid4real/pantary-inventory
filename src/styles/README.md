# Styling structure

- `styles.css` contains the landing page and global design tokens.
- `dashboard.css` contains small authenticated-shell overrides that are clearer in CSS.
- `screen-layout.css` contains the existing screen-specific rules while they are migrated.
- Page-specific styles stay beside their page when they are not shared.

Use Tailwind utilities for component-level layout and spacing. Add shared CSS only when
the rule is reused, needs a pseudo-element, or would be harder to read as a utility list.
Avoid inline `style` props except for values that are genuinely calculated at runtime.
