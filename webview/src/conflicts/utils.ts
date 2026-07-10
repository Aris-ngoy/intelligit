export interface ConflictFileMeta {
	tag?: { label: string; tone: "error" | "info" };
}

export function getConflictFileMeta(filePath: string): ConflictFileMeta {
	const name = filePath.split("/").pop() ?? filePath;
	if (
		name === "package.json" ||
		name === "package-lock.json" ||
		name === "pnpm-lock.yaml"
	) {
		return { tag: { label: "Dependencies", tone: "info" } };
	}
	if (/\.(tsx|jsx|vue|svelte)$/i.test(name) && /components?/i.test(filePath)) {
		return { tag: { label: "Critical Conflict", tone: "error" } };
	}
	return {};
}

export function splitFilePath(filePath: string): {
	folder: string;
	name: string;
} {
	const name = filePath.split("/").pop() ?? filePath;
	const folder = filePath.slice(0, filePath.length - name.length);
	return { folder, name };
}
