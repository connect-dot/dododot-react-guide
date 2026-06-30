import React, { CSSProperties, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Button } from './components/ui/button';
import { useGuide } from './GuideContext';
import { cn } from './lib/utils';
import { getTooltipPosition } from './tooltipPosition';
import { useElementRect } from './useElementRect';
import { useTargetElement } from './useTargetElement';

const Z_BACKDROP = 99999;
const Z_TOOLTIP = 100000;

function getClipPath(
	rect: { top: number; left: number; width: number; height: number },
	pad: number,
): string {
	const t = rect.top - pad;
	const l = rect.left - pad;
	const r = rect.left + rect.width + pad;
	const b = rect.top + rect.height + pad;
	return `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
}

const ACTION_HINTS: Record<string, string> = {
	'highlight-and-click': '해당 영역을 클릭하세요',
	'highlight-only': '',
	'auto-click': '자동으로 진행됩니다...',
	input: '',
};

function DefaultButton({
	variant,
	onClick,
	children,
}: {
	variant: 'primary' | 'secondary';
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Button variant={variant} onClick={onClick}>
			{children}
		</Button>
	);
}

export function GuideOverlay() {
	const { status, currentStep, steps, currentStepIndex, cancelable, advance, goBack, cancel, ui } =
		useGuide();

	const renderButton = ui.renderButton
		? ui.renderButton
		: (props: {
				variant: 'primary' | 'secondary';
				onClick: () => void;
				children: React.ReactNode;
			}) => <DefaultButton {...props} />;

	const { element, searching, timedOut } = useTargetElement(
		status === 'idle' || status === 'completed' || status === 'cancelled'
			? null
			: (currentStep?.targetId ?? null),
		currentStep?.waitForTarget ?? true,
		currentStep?.scrollTo ?? true,
	);

	const rect = useElementRect(element);
	const pad = currentStep?.highlightPadding ?? 8;

	useEffect(() => {
		if (currentStep?.action === 'highlight-and-click' && element && status === 'active') {
			const handler = () => setTimeout(advance, 50);
			element.addEventListener('click', handler);
			return () => element.removeEventListener('click', handler);
		}
	}, [currentStep, element, status, advance]);

	useEffect(() => {
		if (currentStep?.action === 'auto-click' && element && status === 'active') {
			const timer = setTimeout(() => {
				element.click();
				advance();
			}, currentStep.delay ?? 800);
			return () => clearTimeout(timer);
		}
	}, [currentStep, element, status, advance]);

	useEffect(() => {
		if (currentStep?.action === 'input' && element && status === 'active') {
			element.focus();
		}
	}, [currentStep, element, status]);

	if (status === 'idle' || status === 'completed' || status === 'cancelled') return null;

	const loadingClass = cn(
		'crg-fixed crg-top-1/2 crg-left-1/2 -crg-translate-x-1/2 -crg-translate-y-1/2',
		'crg-bg-surface crg-rounded-2xl crg-shadow-crg-tooltip',
		'crg-px-8 crg-py-6 crg-text-[15px] crg-text-subtle',
	);

	if (searching) {
		return createPortal(
			<div className={loadingClass} style={{ zIndex: Z_TOOLTIP }}>
				화면을 준비하고 있습니다...
			</div>,
			document.body,
		);
	}

	if (timedOut) {
		return createPortal(
			<div className={loadingClass} style={{ zIndex: Z_TOOLTIP }}>
				<div className="crg-mb-4">요소를 찾을 수 없습니다</div>
				<div className="crg-flex crg-justify-end crg-gap-2">
					{renderButton({ variant: 'secondary', onClick: cancel, children: '가이드 종료' })}
					{renderButton({ variant: 'primary', onClick: advance, children: '건너뛰기' })}
				</div>
			</div>,
			document.body,
		);
	}

	if (!rect) return null;

	const tooltipPos = getTooltipPosition(rect, currentStep?.tooltipPosition ?? 'auto', pad);
	const hint = ACTION_HINTS[currentStep?.action ?? ''] ?? '';
	const isLast = currentStepIndex === steps.length - 1;
	const isFirst = currentStepIndex === 0;
	const showNav = currentStep?.action === 'highlight-only' || currentStep?.action === 'input';

	const backdropStyle: CSSProperties = {
		zIndex: Z_BACKDROP,
		background: 'rgba(0, 0, 0, var(--crg-backdrop-opacity, 0.55))',
		clipPath: getClipPath(rect, pad),
	};

	const highlightStyle: CSSProperties = {
		zIndex: Z_BACKDROP,
		top: rect.top - pad,
		left: rect.left - pad,
		width: rect.width + pad * 2,
		height: rect.height + pad * 2,
	};

	const tooltipStyle: CSSProperties = {
		zIndex: Z_TOOLTIP,
		...tooltipPos,
	};

	return createPortal(
		<>
			<div
				className="crg-fixed crg-inset-0 crg-transition-[clip-path] crg-duration-300 crg-ease-in-out"
				style={backdropStyle}
				onClick={cancelable ? cancel : undefined}
			/>
			<div
				className={cn(
					'crg-fixed crg-pointer-events-none crg-rounded crg-transition-all crg-duration-300 crg-ease-in-out',
					'crg-border-2 crg-border-solid crg-shadow-crg-highlight',
				)}
				style={{ ...highlightStyle, borderColor: 'var(--crg-brand, #4F46E5)' }}
			/>
			<div
				className="crg-fixed crg-box-border crg-bg-surface crg-rounded-2xl crg-shadow-crg-tooltip crg-px-6 crg-py-5"
				style={tooltipStyle}>
				<div className="crg-flex crg-justify-between crg-items-center crg-mb-3">
					<span className="crg-text-[13px] crg-text-subtle crg-font-semibold">
						{currentStepIndex + 1} / {steps.length}
					</span>
					{cancelable && (
						<Button variant="ghost" size="icon" onClick={cancel} aria-label="가이드 닫기">
							✕
						</Button>
					)}
				</div>
				<div className="crg-text-[15px] crg-leading-relaxed crg-text-foreground crg-mb-4">
					{currentStep?.message}
				</div>
				{hint && (
					<div className="crg-text-[13px] crg-text-brand crg-mb-3 crg-font-medium">
						{hint}
					</div>
				)}
				{showNav && (
					<div className="crg-flex crg-justify-end crg-gap-2">
						{!isFirst && renderButton({ variant: 'secondary', onClick: goBack, children: '이전' })}
						{renderButton({
							variant: 'primary',
							onClick: advance,
							children: currentStep?.action === 'input' ? '입력 완료' : isLast ? '완료' : '다음',
						})}
					</div>
				)}
			</div>
		</>,
		document.body,
	);
}
