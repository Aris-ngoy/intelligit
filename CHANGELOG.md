# Change Log

All notable changes to the IntelliGit extension are documented here. This project
follows [Keep a Changelog](http://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

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
