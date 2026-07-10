import { useGitLogStore } from "../shared/store";

export function GitLogFooter() {
	const openExternal = useGitLogStore((s) => s.openExternal);

	return (
		<footer className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-[11px] text-[var(--color-muted)]">
			<span>Everything safe. You can always undo.</span>
			<div className="flex items-center gap-3">
				<button
					type="button"
					className="hover:text-[var(--color-app-fg)] hover:underline"
					onClick={() =>
						void openExternal("https://github.com/Aris-ngoy/intelligit#readme")
					}
				>
					Documentation
				</button>
				<button
					type="button"
					className="hover:text-[var(--color-app-fg)] hover:underline"
					onClick={() =>
						void openExternal("https://github.com/Aris-ngoy/intelligit/issues")
					}
				>
					Support
				</button>
			</div>
		</footer>
	);
}
