/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
	extends: ["@commitlint/config-conventional"],
	helpUrl:
		"https://github.com/Aris-ngoy/intelligit/blob/main/docs/COMMIT_CONVENTION.md",
	rules: {
		// Allowed commit types — see docs/COMMIT_CONVENTION.md
		"type-enum": [
			2,
			"always",
			[
				"feat", // New user-facing capability
				"fix", // Bug fix
				"docs", // Documentation only
				"style", // Formatting, whitespace (no logic change)
				"refactor", // Code change that is neither feat nor fix
				"perf", // Performance improvement
				"test", // Adding or updating tests
				"build", // Build tooling or bundler changes
				"ci", // CI/CD pipeline changes
				"chore", // Maintenance, deps, config (non-user-facing)
				"release", // Version bump / marketplace release
				"revert", // Revert a previous commit
			],
		],
		// Recommended scopes for IntelliGit — warn on unknown scopes
		"scope-enum": [
			1,
			"always",
			[
				"extension", // VS Code extension host (src/extension.ts, activation)
				"webview", // React webview UI
				"git", // Git service / plumbing
				"rebase", // Rebase & interactive rebase
				"merge", // Merge editor & conflict resolution
				"conflicts", // Conflicts panel
				"stash", // Stash UI
				"commit", // Commit message UI / staging
				"panel", // Git log panel & sidebar
				"protocol", // Extension ↔ webview messages
				"ci", // GitHub Actions
				"deps", // Dependency updates
				"release", // Release automation
			],
		],
		"scope-case": [2, "always", "lower-case"],
		"subject-case": [
			2,
			"never",
			["sentence-case", "start-case", "pascal-case", "upper-case"],
		],
		"subject-empty": [2, "never"],
		"subject-full-stop": [2, "never", "."],
		"header-max-length": [2, "always", 100],
		"body-leading-blank": [2, "always"],
		"body-max-line-length": [2, "always", 100],
		"footer-leading-blank": [2, "always"],
	},
};
