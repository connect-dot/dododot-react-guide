import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useGuide } from './GuideContext';
import { cn } from './lib/utils';

const TOAST_ZINDEX = 100001;

export function GuideNotification() {
	const { status, reset, ui } = useGuide();
	const [visible, setVisible] = useState(false);
	const [lastStatus, setLastStatus] = useState(status);

	useEffect(() => {
		if (status === 'completed' || status === 'cancelled') {
			setLastStatus(status);

			if (ui.showToast) {
				const message =
					status === 'completed' ? '가이드를 완료했습니다!' : '가이드가 취소되었습니다.';
				const type = status === 'completed' ? 'success' : 'info';
				ui.showToast(message, type);
				setTimeout(reset, 300);
				return;
			}

			setVisible(true);
			const timer = setTimeout(() => {
				setVisible(false);
				setTimeout(reset, 300);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [status, reset, ui]);

	if (ui.showToast) return null;

	if (status !== 'completed' && status !== 'cancelled' && !visible) return null;

	const isCompleted = lastStatus === 'completed';

	return createPortal(
		<div
			className={cn(
				'crg-fixed crg-bottom-6 crg-left-1/2 -crg-translate-x-1/2',
				'crg-rounded-xl crg-px-7 crg-py-3.5',
				'crg-text-[15px] crg-font-medium crg-text-white',
				'crg-shadow-toast crg-transition-all crg-duration-300 crg-ease-in-out',
				isCompleted ? 'crg-bg-success' : 'crg-bg-subtle',
				visible
					? 'crg-opacity-100 crg-translate-y-0'
					: 'crg-opacity-0 crg-translate-y-2.5 crg-pointer-events-none',
			)}
			style={{ zIndex: TOAST_ZINDEX }}>
			{isCompleted ? '가이드를 완료했습니다!' : '가이드가 취소되었습니다.'}
		</div>,
		document.body,
	);
}
