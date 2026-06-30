export type GuideAction = 'highlight-and-click' | 'highlight-only' | 'auto-click' | 'input';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type GuideStatus =
	| 'idle'
	| 'active'
	| 'waiting-target'
	| 'paused'
	| 'completed'
	| 'cancelled';

export interface GuideStep {
	targetId: string;
	action: GuideAction;
	message: string;
	tooltipPosition?: TooltipPosition;
	delay?: number;
	waitForTarget?: boolean;
	scrollTo?: boolean;
	highlightPadding?: number;
}

export interface GuideData {
	id: string;
	title?: string;
	cancelable: boolean;
	steps: GuideStep[];
}

export interface GuideJson {
	guide: GuideData;
}

export interface GuideState {
	status: GuideStatus;
	guideId: string | null;
	title: string;
	cancelable: boolean;
	steps: GuideStep[];
	currentStepIndex: number;
	error: string | null;
}

export interface GuideUIComponents {
	renderButton?: (props: {
		variant: 'primary' | 'secondary';
		onClick: () => void;
		children: React.ReactNode;
	}) => React.ReactNode;
	showToast?: (message: string, type: 'success' | 'info') => void;
}

export function validateGuideJson(data: unknown): data is GuideJson {
	if (typeof data !== 'object' || data === null) return false;
	const obj = data as Record<string, unknown>;
	if (typeof obj.guide !== 'object' || obj.guide === null) return false;
	const guide = obj.guide as Record<string, unknown>;
	if (!Array.isArray(guide.steps) || guide.steps.length === 0) return false;
	if (typeof guide.id !== 'string') return false;
	return guide.steps.every((step: unknown) => {
		if (typeof step !== 'object' || step === null) return false;
		const s = step as Record<string, unknown>;
		return (
			typeof s.targetId === 'string' &&
			typeof s.action === 'string' &&
			typeof s.message === 'string'
		);
	});
}
