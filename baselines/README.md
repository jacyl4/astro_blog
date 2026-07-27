# Refactor Baselines

This directory contains machine-readable snapshots captured before the architecture
refactor. Route additions are allowed; route removals require an explicit entry in
`redirects.json`.

- `routes.json`: public static route baseline captured from the clean pre-refactor
  `HEAD`.
- `2026-07-27-head/`: clean-install and clean-build evidence for the baseline
  commit.

Generated working evidence belongs under `.build/evidence/` and is not a source of
truth.
