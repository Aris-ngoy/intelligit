# Change Log

All notable changes to the IntelliGit extension are documented here. This project
follows [Keep a Changelog](http://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

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
