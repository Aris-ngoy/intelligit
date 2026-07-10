import {
	type MouseEvent as ReactMouseEvent,
	useCallback,
	useEffect,
	useRef,
} from "react";

interface ColumnResizeHandleProps {
	onResize: (deltaX: number) => void;
}

export function ColumnResizeHandle({ onResize }: ColumnResizeHandleProps) {
	const onResizeRef = useRef(onResize);
	onResizeRef.current = onResize;

	const onMouseDown = useCallback((event: ReactMouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		let lastX = event.clientX;

		const onMouseMove = (moveEvent: MouseEvent) => {
			const delta = moveEvent.clientX - lastX;
			lastX = moveEvent.clientX;
			onResizeRef.current(delta);
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};

		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	}, []);

	useEffect(() => {
		return () => {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
	}, []);

	return (
		<div
			role="separator"
			aria-orientation="vertical"
			className="absolute top-0 right-0 z-20 h-full w-1.5 translate-x-1/2 cursor-col-resize touch-none hover:bg-[var(--color-accent)]/40"
			onMouseDown={onMouseDown}
			onClick={(event) => event.stopPropagation()}
		/>
	);
}
