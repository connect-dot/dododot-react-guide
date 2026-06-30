import { CSSProperties } from 'react';

import { TooltipPosition } from './types';

const TOOLTIP_WIDTH = 320;
const TOOLTIP_MIN_WIDTH = 240;
const TOOLTIP_ESTIMATED_HEIGHT = 240;
const GAP = 12;
const EDGE_MARGIN = 16;

interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

function pickBestDirection(rect: Rect): Exclude<TooltipPosition, 'auto'> {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const spaces = {
		bottom: vh - (rect.top + rect.height),
		top: rect.top,
		right: vw - (rect.left + rect.width),
		left: rect.left,
	};
	return Object.entries(spaces).sort((a, b) => b[1] - a[1])[0][0] as Exclude<
		TooltipPosition,
		'auto'
	>;
}

function getTooltipWidth(): number {
	const vw = window.innerWidth;
	return Math.min(TOOLTIP_WIDTH, Math.max(TOOLTIP_MIN_WIDTH, vw - EDGE_MARGIN * 2));
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

function clampX(x: number, width: number): number {
	const vw = window.innerWidth;
	return clamp(x, EDGE_MARGIN, Math.max(EDGE_MARGIN, vw - width - EDGE_MARGIN));
}

function clampY(y: number): number {
	const vh = window.innerHeight;
	return clamp(
		y,
		EDGE_MARGIN,
		Math.max(EDGE_MARGIN, vh - TOOLTIP_ESTIMATED_HEIGHT - EDGE_MARGIN),
	);
}

function baseStyle(width: number): CSSProperties {
	return {
		position: 'fixed',
		width,
		maxHeight: `calc(100vh - ${EDGE_MARGIN * 2}px)`,
		overflowY: 'auto',
	};
}

export function getTooltipPosition(
	rect: Rect,
	position: TooltipPosition,
	padding: number,
): CSSProperties {
	const dir = position === 'auto' ? pickBestDirection(rect) : position;
	const width = getTooltipWidth();
	const centerX = rect.left + rect.width / 2 - width / 2;
	const centerY = rect.top + rect.height / 2 - TOOLTIP_ESTIMATED_HEIGHT / 2;

	switch (dir) {
		case 'bottom':
			return {
				...baseStyle(width),
				top: clampY(rect.top + rect.height + padding + GAP),
				left: clampX(centerX, width),
			};
		case 'top':
			return {
				...baseStyle(width),
				top: clampY(rect.top - padding - GAP - TOOLTIP_ESTIMATED_HEIGHT),
				left: clampX(centerX, width),
			};
		case 'right':
			return {
				...baseStyle(width),
				top: clampY(centerY),
				left: clampX(rect.left + rect.width + padding + GAP, width),
			};
		case 'left':
			return {
				...baseStyle(width),
				top: clampY(centerY),
				left: clampX(rect.left - padding - GAP - width, width),
			};
		default:
			return {
				...baseStyle(width),
				top: clampY(rect.top + rect.height + padding + GAP),
				left: clampX(centerX, width),
			};
	}
}
