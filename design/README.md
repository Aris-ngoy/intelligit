# IntelliGit — Stitch Redesign Brief

A design brief for redesigning the **entire IntelliGit interface** in
[Stitch](https://stitch.withgoogle.com). Paste the relevant section into Stitch
(one screen at a time gives the best results), or hand Stitch the whole document
as context and ask it to generate the screen set.

IntelliGit is a VS Code / Cursor extension that makes Git approachable for
beginners: a visual commit graph, a plain-language rebase, and a friendly
conflict resolver — all rendered as **webviews embedded inside the editor**.

---

## 1. What to design

Redesign these 7 surfaces as a cohesive set:

1. **Git Log panel** — the main 3-pane commit explorer (default view).
2. **Move my work** — the guided rebase dialog.
3. **Tidy up my changes** — the beginner-friendly interactive rebase.
4. **Two versions don't agree** — the conflict file list.
5. **3-way merge editor** — side-by-side line resolver.
6. **Empty / loading / error states** for the above.
7. **Commit context menu** — right-click actions on a commit.

The redesign should feel like one product, not seven screens.

---

## 2. Who it's for & the voice

- **Audience:** developers new to Git — students, bootcamp grads, designers who
  code. They are scared of `rebase`, `squash`, and merge conflicts.
- **Voice:** warm, plain-English, reassuring. We say *"Move my work"* not
  *"Rebase onto"*, *"Combine"* not *"fixup"*, *"Two versions don't agree"* not
  *"Merge conflict"*. Keep a light touch of friendly emoji as wayfinding, never
  decoration overload.
- **Promise:** every destructive-looking action reassures ("you can always
  undo it"). Nothing should feel like it could break the user's work.

Keep this tone in every label, helper line, and empty state Stitch produces.

---

## 3. Hard platform constraints (must respect)

These are non-negotiable because the UI lives inside the editor:

- **Embedded webview, not a standalone app.** No browser chrome, no marketing
  hero, no top nav bar. Each surface fills a panel that can be **narrow**
  (down to ~280px) or wide. Design **fluid, single-column-friendly** layouts.
- **Must inherit the editor theme.** The UI has to look correct in **both dark
  and light** themes, and high-contrast. Design against the VS Code theme tokens
  in §4 rather than hard-coded hex. Show a dark mockup and a light mockup.
- **Dense but breathable.** This is a power tool shown in a small panel. Favor
  compact spacing, small type (11–14px), and clear hierarchy over big hero
  spacing. Think "JetBrains Git tool window," not "landing page."
- **Resizable split panes.** The Git Log and merge editor use draggable
  dividers between panes — design the panes to degrade gracefully at min width.
- **Keyboard + accessibility.** Every control needs a visible focus ring,
  adequate contrast, and an accessible label. Selectable rows, checkboxes, and
  drag handles must be obvious.

---

## 4. Design system (use these tokens)

The app maps every color to a VS Code theme variable with a dark fallback.
Design with these **semantic roles** so the result themes automatically:

| Role | Token | Dark fallback | Use for |
| --- | --- | --- | --- |
| App background | `--color-app-bg` | `#2b2b2b` | panel surface |
| App foreground | `--color-app-fg` | `#bbbbbb` | primary text |
| Border | `--color-border` | `#3c3f41` | dividers, card outlines |
| Hover | `--color-hover` | `#2a2d2e` | row/button hover |
| Selected | `--color-selected` | `#214283` | selected row bg |
| Selected text | `--color-selected-fg` | `#ffffff` | selected row text |
| Muted | `--color-muted` | `#808080` | secondary text, labels |
| Input bg | `--color-input-bg` | `#3c3c3c` | fields, chips, cards |
| Input border | `--color-input-border` | `#646464` | field outlines |
| Accent | `--color-accent` | `#3574f0` | primary buttons, active state |
| Error | `--color-error` | `#f75464` | errors, warnings |

Action-color conventions already in use (keep them):

- **Keep** → green · **Rename** → blue · **Combine** → purple · **Delete** → red
- Conflict diff highlights: **yours/local** tinted red, **theirs/incoming**
  tinted green.

**Typography:** editor UI font (system sans). Body 13px, labels/help 11px,
headings 14–18px. **Monospace** for hashes, file paths, and code/diff lines.

**Shape & spacing:** rounded cards (`rounded-xl`), 8–16px padding inside cards,
~8px gaps. Pills/chips for refs and branch names. Subtle borders over heavy
shadows (shadows read poorly inside the editor).

Deliver Stitch output as **components**: `Card`, `PrimaryButton`,
`SegmentedActionButton` (icon over label), `Chip`, `Toolbar`, `SectionHeader`,
`SplitPane`, `EmptyState`.

---

## 5. Global patterns

- **Header** (top of each task surface): emoji + short title (e.g. "🧹 Tidy up
  my changes") and a one-line plain-English explanation in muted text, with a
  bottom border.
- **Footer action bar**: secondary/cancel action on the left, a full-width or
  right-aligned **primary button** that summarizes the outcome ("🎉 All done —
  apply my changes", "✅ Move it onto 'main'"). Primary buttons are disabled
  with explanatory text until the user is ready ("Pick a branch first ☝️").
- **Cards** for list items (commits, conflicts), with a selected state using the
  accent border + tinted input background.
- **Inline status strips**: info (ℹ️ muted bg), warning/error (⚠️ error-tinted
  bg) appear directly under the header.
- **Reassurance line** near primary actions.

---

## 6. Screen-by-screen briefs

### 6.1 Git Log panel (primary view)

Three resizable vertical panes under a filter toolbar.

- **Toolbar** (top, wraps on narrow widths): current branch name (muted, bold),
  then dropdowns for **branch scope** (All / Local / Remote / specific branch),
  **author**, **date** (Any time / Today / Yesterday / Last week), and a flexible
  **path filter** text input. Compact, single row that wraps.
- **Left pane — Branch tree** (~15%, min 120px): grouped sections "All",
  "Current", "Local", "Remote" with uppercase muted section labels. Items are
  selectable rows; current branch is bold; selected row uses the selected token.
- **Center pane — Commit table** (flex, min 280px): a header row with columns
  **Graph · Commit · Author · Date**, then scrollable rows. The Graph column
  renders a **colored commit-graph** (lanes, nodes, branch/merge lines) like Git
  Graph / GitKraken. Each row: graph node, commit subject (+ ref chips like
  `main`, `origin/main`, tags), author, relative date. Row hover + selected
  states. Right-click opens the context menu (§6.7).
- **Right pane — Detail panel** (~30%, min 200px): for the selected commit show
  short hash (mono, muted), subject (bold), optional body (wrapped), author +
  email, ref chips, then a scrollable **Changed files (N)** list — each file a
  clickable row with a status label (Added/Modified/Deleted) and mono path that
  opens a diff. Empty state: "Select a commit to view details".

> **Stitch prompt:** *Design a VS Code extension panel for a visual Git log.
> Dark and light theme versions. A compact filter toolbar (branch, author, date
> dropdowns + path search). Below it, three resizable columns: a branch tree
> sidebar grouped into Current/Local/Remote; a center commit list with a colored
> commit-graph rail, commit message with small ref badges, author and relative
> date; and a right detail pane showing the selected commit's hash, message,
> author, and a scrollable changed-files list. Dense, professional, JetBrains-like,
> using the editor's theme colors. Rounded selection highlight, monospace for
> hashes and paths.*

### 6.2 Move my work (rebase dialog)

Centered, max ~640px wide, scrollable, friendly.

- **Header:** "📦 Move my work" + explanation: *"This takes everything you've
  been working on and stacks it neatly on top of another branch."*
- **Step 1 card** (numbered badge "1" — "What I'm moving"): shows the current
  branch as a 🌿 chip with "(all your latest changes)".
- A big **⬇️** arrow between steps.
- **Step 2 card** (badge "2" — "Put it on top of…"): full-width branch
  **dropdown** ("👉 Choose a branch…"), helper "usually **main**".
- **Error strip** (⚠️) when present.
- **"Show extra options (for grown-ups)"** disclosure revealing checkboxes:
  Auto-stash, Skip checks, Keep empty commits, Auto-squash — each with a
  one-line plain explanation.
- **Footer:** full-width primary button that reflects state — disabled "Pick a
  branch first ☝️" → enabled "✅ Move it onto 'main'" → loading "Moving your
  work…", with reassurance line "you can always undo it".

> **Stitch prompt:** *Design a friendly two-step "rebase made simple" dialog for
> a code editor. Step 1 card shows the current branch as a leaf chip. A downward
> arrow leads to Step 2 card with a branch picker dropdown. A collapsible
> "advanced options" section with labeled checkboxes. A large primary button at
> the bottom whose label changes with state. Warm, beginner-friendly tone, dark
> and light theme, editor theme colors, numbered step badges.*

### 6.3 Tidy up my changes (interactive rebase)

Header + scrollable list of commit cards + footer.

- **Header:** "🧹 Tidy up my changes" + "Each box below is something you saved
  on **branch**. Choose what to do… Drag (or use arrows) to reorder."
- **Commit card** (one per commit): a **drag handle (⠿)**, a circular **order
  number**, the commit message (or an inline text field when "Rename" is
  chosen), and a one-line helper describing the current action. **Up/down arrow**
  buttons on the right. Selected card = accent border; dragged = faded;
  drop target = accent ring; deleted = strikethrough + dimmed.
- **Action chooser** inside each card: a 4-up segmented control of icon-over-
  label buttons — **✅ Keep** (green), **✏️ Rename** (blue), **🔗 Combine**
  (purple), **🗑️ Delete** (red). Active button is filled with its color.
  "Combine" is disabled on the first card.
- **Footer:** summary "You'll end up with **N** changes" + full-width primary
  "🎉 All done — apply my changes" (→ "Working on it…").

> **Stitch prompt:** *Design a beginner-friendly interactive-rebase screen as a
> vertical list of commit cards inside an editor panel. Each card has a drag
> handle, an order number, the commit message, and a row of four color-coded
> icon buttons: Keep (green), Rename (blue), Combine (purple), Delete (red).
> Selected/drag/drop states. A footer shows the resulting commit count and a big
> apply button. Friendly, reassuring, dark and light theme.*

### 6.4 Two versions don't agree (conflicts list)

Header + list of conflicted-file cards + footer.

- **Header:** "🤝 Two versions don't agree" + plain explanation.
- Optional **operation info strip** (ℹ️) and **error strip** (⚠️).
- Count line "N files need your help", then a **file card** per conflict: 📄
  icon, folder path (muted) + filename (bold) in mono, and a **3-up choice
  control**: **🙋 Keep mine**, **👥 Keep theirs**, **🔍 Compare…** (primary).
- **Footer:** left "✖ Cancel everything"; right primary that is disabled until
  all files resolved ("Fix all N first ☝️" → "✅ Finish up").
- **Empty/success state:** centered 🎉, "All sorted!", "Every file agrees now."
  and (if a rebase is in progress) a "✅ Finish up" button.

> **Stitch prompt:** *Design a merge-conflict resolution list for a code editor.
> Header explaining "two versions don't agree" in plain language. A list of file
> cards, each with a file icon, path, and three buttons: Keep mine, Keep theirs,
> Compare (primary). Footer with Cancel and a Finish button disabled until all
> are resolved. Include the empty success state with a celebratory message.
> Dark and light theme, friendly tone.*

### 6.5 3-way merge editor

Top bar + three resizable columns + bottom action bar.

- **Top bar:** mono file path (left), "N conflicts remaining" (right, muted).
- **Three columns** (resizable, ~33% each): **Local (Yours)** read-only,
  **Result** editable in the center, **Incoming (Theirs)** read-only. Column
  headers label each side; read-only sides are tagged "(read-only)".
- Lines are monospace. In conflict blocks: the left/yours side tinted red, the
  right/theirs side tinted green. In the center, each block exposes **hover
  gutter buttons** to take left (`>>`), take right (`<<`), or ignore (`×`); the
  result text is editable.
- **Bottom bar:** left "Accept Left" / "Accept Right" (take-all); right "Cancel"
  + primary **Apply** (disabled until 0 conflicts remain).

> **Stitch prompt:** *Design a three-column 3-way merge editor for a code editor
> webview: left "Local (Yours)" read-only, center "Result" editable, right
> "Incoming (Theirs)" read-only, all monospace. Conflict regions tinted red on
> the left and green on the right, with small hover buttons in the center to take
> left, take right, or skip a block. A top bar with the file path and remaining
> conflict count, and a bottom bar with take-all buttons and a primary Apply
> button. Dark and light theme.*

### 6.6 Loading / empty / error states

Design a consistent set, centered in the panel with muted text and friendly
copy already in the product:

- Loading: "Loading commit history…", "Loading your changes…", "Looking for
  disagreements…", "Loading merge editor…".
- Empty success (conflicts): the 🎉 "All sorted!" card above.
- Empty detail: "Select a commit to view details".
- Error: centered message in the error color; inline error strips elsewhere.

### 6.7 Commit context menu

A small floating menu opened by right-clicking a commit in the log. Design a
compact themed popover with rows (icon + label) for commit actions such as
**Interactively rebase from here…**, **Rebase…**, copy hash, etc. Hover state,
divider groups, anchored to the cursor.

---

## 7. Deliverables to request from Stitch

Ask Stitch to produce, for each surface:

1. A **dark-theme** and a **light-theme** mockup.
2. A **narrow** (~320px) and a **wide** layout for the Git Log and merge editor.
3. A shared **component sheet** (buttons, cards, chips, segmented action
   buttons, inputs, dropdowns, headers, footers, empty states).
4. The mapping of each color to the semantic role in §4 (so it stays themeable).

Keep flows, labels, and the reassuring voice intact — this redesign is about
visual polish, hierarchy, and consistency, **not** changing what the tool does.
