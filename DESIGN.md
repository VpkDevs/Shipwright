# Shipwright Design System Direction

## Visual Direction

Shipwright should look like a serious developer operations tool: compact, structured, and durable. It should be more like a deployment console or review cockpit than a marketing site. The memorable quality should be clarity under pressure: users can immediately see what blocks deployment, what is safe, and what needs review.

## Color

Use a restrained operational palette with semantic severity colors.

- Base surfaces: use cool, tinted neutrals rather than pure black, pure white, or generic slate everywhere.
- Primary action: use one calm, trustworthy accent. Avoid purple-to-blue gradients and cyan-on-dark as the identity.
- Severity: reserve red for blockers, amber for warnings, green for passed checks, and muted blue/steel for informational notes.
- Contrast: text, labels, buttons, code blocks, and focus states must meet practical readability needs. Do not use washed-out gray text on colored backgrounds.
- Gradients: avoid decorative gradient backgrounds. If a gradient is used, it must support hierarchy or depth, not act as ornament.

## Typography

Avoid using a single system stack for everything in future redesigns.

- Pair a distinctive but serious display face with a refined body face.
- Do not use monospace as a shorthand for "developer." Reserve monospace for code, paths, environment variables, commands, logs, and generated file previews.
- Build clear hierarchy with fewer sizes and stronger contrast between levels.
- Use uppercase only for short labels, status chips, or table metadata.
- Keep dense product surfaces readable: headings should be compact, labels should be short, and long prose should be broken into scannable sections.

## Layout And Space

Use a 4px spacing base for precision: 4, 8, 12, 16, 24, 32, 48, 64, 96.

- Prefer `gap` over margin for sibling spacing.
- Use full-width work surfaces and structured regions instead of nesting cards inside cards.
- Keep dashboards and repo analysis pages optimized for scanning, comparison, and repeated action.
- Use sticky or persistent context only when it helps the user keep diagnosis visible.
- Avoid identical repeated card grids as the default layout pattern.
- Empty states should teach the next action without marketing filler.

## Components

Core components should be purpose-built for deployment diagnosis.

- Readiness summary: compact top-level diagnosis with risk, confidence, and next action.
- Issue list: severity, title, file/path when relevant, fix, and evidence.
- Generated artifact preview: readable code/markdown previews with stable dimensions and no layout jump.
- Action controls: primary actions only for irreversible or workflow-advancing steps; secondary/ghost actions for navigation and inspection.
- Repository rows: optimized for comparison, with language, activity, risk state, and short description.
- Tabs: use for generated artifact categories and analysis dimensions.
- Status indicators: use familiar symbols and labels; do not rely on color alone.

Avoid large icon tiles, decorative emoji, generic rounded cards with drop shadows, and thick side-border accent cards.

## Motion And Interaction

Motion should communicate state, not personality.

- Use short transitions for loading, progress, hover, focus, and generated-content arrival.
- Avoid bounce, wiggle, and decorative animations.
- Respect `prefers-reduced-motion`.
- Loading states should say what is happening: analyzing repo, scanning source env vars, generating plan, creating PR.
- Prefer progressive disclosure over modals for advanced details.

## Copy

Write like a senior engineer.

- Be specific and actionable.
- Do not overpromise deployment certainty.
- Say "inferred" when a fact is inferred.
- Say "not detected" rather than "missing" when absence may be acceptable.
- Avoid motivational fluff.
- Generated PR copy should be useful for future maintainers reading the history.

## Do

- Show blockers before optional polish.
- Make file paths, commands, and environment variables easy to copy and inspect.
- Keep code previews legible and stable.
- Use semantic design tokens for spacing, color, and states.
- Run an audit/polish pass after functional work is complete.

## Do Not

- Default to purple gradients, neon glows, glassmorphism, or decorative blurred blobs.
- Use cards inside cards.
- Use emoji as the main product iconography.
- Use modals as the default place for configuration.
- Use gradient text for emphasis.
- Hide critical diagnosis on mobile.

## Impeccable Anti-Pattern Compliance

Treat these as hard review gates for Shipwright UI work.

- No AI color palette: avoid purple/violet gradients, cyan-on-dark defaults, and glow-heavy dark surfaces.
- No glassmorphism as decoration: blur and translucent panels are allowed only when they solve a real layering problem.
- No cardocalypse: avoid repeated cards, cards inside cards, and same-size feature-card grids.
- No side-tab accent borders: do not use thick colored side borders on rounded cards.
- No rounded generic shadow boxes as the default visual language.
- No oversized icon tiles above headings.
- No decorative sparklines or fake metrics.
- No monospace type for "developer vibes"; use monospace only for code and technical literals.
- No single-font hierarchy in future redesigns; use deliberate typographic contrast.
- No modal-first workflows for complex settings or generated artifacts.
- No redundant UX writing: label something once, clearly.
- No motion without purpose: state changes, progress, and feedback only.
- No hidden critical functionality on mobile.

## Impeccable Working Process

For any non-trivial UI change:

1. Read `PRODUCT.md`, `DESIGN.md`, and `.impeccable.md`.
2. Identify whether the work is product UI, marketing/brand UI, or documentation UI. Shipwright's default register is product.
3. Implement functionally complete UI first.
4. Run an Impeccable-style critique against the anti-pattern list above.
5. Run a polish pass only after the feature works: alignment, spacing, type, contrast, states, motion, copy.
6. Before shipping, inspect the UI for the visible AI-design tells listed in this file and remove them unless there is a documented product reason.
