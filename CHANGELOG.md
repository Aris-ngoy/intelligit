# Change Log

All notable changes to the IntelliGit extension are documented here. This project
follows [Keep a Changelog](http://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [0.4.5] - 2026-07-09

### Fixed
- Regenerated the marketplace icon PNG for sharper rendering at smaller file size.

## [0.4.4] - 2026-07-09

### Changed
- Updated marketplace and activity-bar icons to the Lucide GitGraph glyph
  (`icon.svg`, `icon.png`, `sidebar-icon.svg`).

## [0.4.3] - 2026-07-09

### Changed
- Replaced hand-drawn SVG icons with [Lucide](https://lucide.dev) across the webview UI.

### Fixed
- Restored the IntelliGit branch logo for the marketplace icon (`icon.svg` / `icon.png`).
- Restored the activity-bar sidebar icon so it renders correctly instead of showing a gray
  placeholder (stroke-only SVGs do not mask properly in VS Code's activity bar).

## [0.4.2] - 2026-07-09

### Fixed
- Activity-bar icon now matches the marketplace logo: full gradient background and
  correctly scaled branch mark (the previous sidebar SVG was tiny and monochrome).

## [0.4.1] - 2026-07-09

### Changed
- Unified the activity-bar and marketplace icons around the IntelliGit branch logo.
- Added `media/icon.svg` as the source for the marketplace PNG and regenerated `icon.png`.

## [0.4.0] - 2026-07-09

### Added
- Stashes panel to search, apply, and delete saved changes, with a sidebar shortcut
  and SCM title-bar button.
- Resizable Git Log commit table columns (graph, message, author, date) with widths
  persisted in the webview.
- Shared SVG icon set across sidebar, dialogs, context menus, and task panels.
- Playwright end-to-end coverage for the commit table layout.

### Changed
- Replaced emoji wayfinding icons with theme-aware SVG icons throughout the UI.
- Commit table author column now stacks name and email on separate lines.

## [0.3.0] - 2026-07-08

### Added
- Sidebar feature hub listing all IntelliGit actions: Git History, Refresh, Pull,
  Push, Fetch, Rebase, Interactive Rebase, and Resolve Conflicts.
- Pull, Push, and Fetch commands (`intelligit.pull`, `intelligit.push`,
  `intelligit.fetch`) available from the sidebar and Command Palette.

### Changed
- The activity-bar panel is now a compact action hub instead of a cramped
  three-column Git Log layout.
- IntelliGit no longer auto-opens the full-screen Git Log on startup or when
  opening the sidebar; open Git History manually when you want the graph.
- Renamed the sidebar view from "Git Log" to "IntelliGit".

## [0.2.0] - 2026-06-19

### Added
- Full-screen Git Log editor panel (`intelligit.gitLogPanel`) with a roomy layout
  instead of the narrow activity-bar rail.
- "Open Git Log in Editor (Full Screen)" command and a view title button to launch
  the full-screen panel.

### Changed
- Opening the IntelliGit activity-bar view now promotes the full-screen Git Log
  editor once per session, and the extension lands users there by default.
- Renamed "Open Git Log" to "Open Git Log (Full Screen)"; it now opens the
  full-screen editor panel.
- New dedicated sidebar icon for the IntelliGit activity-bar container.

## [0.1.1] - 2026-06-19

### Added
- "Move my work from here…" commit context-menu action that opens the rebase
  dialog pre-scoped to the selected commit.
- Git Log banner that surfaces an in-progress rebase/merge with a quick
  "Open conflicts" shortcut.
- Commit timestamps in the interactive rebase ("Tidy up") list.

### Changed
- IntelliGit now lives in the activity bar (left side menu) instead of the
  bottom panel.
- Rebase dialog polish to match the design: subtle "CURRENT" tag and a circular
  step-divider arrow.
- Friendlier webview panel titles ("Move my work", "Tidy up my changes",
  "Two versions don't agree").

### Fixed
- Interactive rebase and rebase dialog panels now close automatically once the
  rebase completes successfully.

## [0.1.0] - 2026-06-19

### Added
- Visual Git Log panel with commit graph, detail panel, and refresh.
- Guided "Move my work" rebase dialog with a branch picker and collapsible
  advanced flags.
- Beginner-friendly interactive rebase: Keep / Rename / Combine / Delete actions
  with reordering.
- Conflict resolution: conflicted-file list with Accept Yours/Theirs and a 3-way
  merge editor; continue/abort for rebase and merge.

### Fixed
- Interactive rebase no longer blocks on an interactive editor for Rename
  (reword) / Combine; the new commit message from the UI is now applied.
