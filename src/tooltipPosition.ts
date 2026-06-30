import { CSSProperties } from 'react';

import { TooltipPosition } from './types';

const TOOLTIP_WIDTH = 320;
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

function clampX(x: number): number {
	const vw = window.innerWidth;
	return Math.max(EDGE_MARGIN, Math.min(x, vw - TOOLTIP_WIDTH - EDGE_MARGIN));
}

export function getTooltipPosition(
	rect: Rect,
	position: TooltipPosition,
	padding: number,
): CSSProperties {
	const dir = position === 'auto' ? pickBestDirection(rect) : position;
	const centerX = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;

	switch (dir) {
		case 'bottom':
			return {
				position: 'fixed',
				top: rect.top + rect.height + padding + GAP,
				left: clampX(centerX),
				width: TOOLTIP_WIDTH,
			};
		case 'top':
			return {
				position: 'fixed',
				bottom: window.innerHeight - rect.top + padding + GAP,
				left: clampX(centerX),
				width: TOOLTIP_WIDTH,
			};
		case 'right':
			return {
				position: 'fixed',
				top: rect.top + rect.height / 2,
				left: rect.left + rect.width + padding + GAP,
				width: TOOLTIP_WIDTH,
				transform: 'translateY(-50%)',
			};
		case 'left':
			return {
				position: 'fixed',
				top: rect.top + rect.height / 2,
				left: rect.left - padding - GAP - TOOLTIP_WIDTH,
				width: TOOLTIP_WIDTH,
				transform: 'translateY(-50%)',
			};
		default:
			return {
				position: 'fixed',
				top: rect.top + rect.height + padding + GAP,
				left: clampX(centerX),
				width: TOOLTIP_WIDTH,
			};
	}
}
