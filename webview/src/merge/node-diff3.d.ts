declare module 'node-diff3' {
	export interface IRegion {
		stable: boolean;
		bufferContent?: string[];
		aContent?: string[];
		oContent?: string[];
		bContent?: string[];
	}

	export function diff3MergeRegions(
		a: string[],
		o: string[],
		b: string[],
	): IRegion[];
}
