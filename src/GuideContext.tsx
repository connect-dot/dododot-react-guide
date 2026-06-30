import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

import { GuideJson, GuideState, GuideStep, GuideUIComponents, validateGuideJson } from './types';

type GuideContextValue = GuideState & {
	currentStep: GuideStep | null;
	startGuide(json: GuideJson): void;
	advance(): void;
	goBack(): void;
	cancel(): void;
	reset(): void;
	goToStep(index: number): void;
	setWaiting(): void;
	setFound(): void;
	ui: GuideUIComponents;
};

type Action =
	| { type: 'START_GUIDE'; payload: GuideJson }
	| { type: 'NEXT_STEP' }
	| { type: 'PREV_STEP' }
	| { type: 'GO_TO_STEP'; payload: number }
	| { type: 'WAITING_TARGET' }
	| { type: 'TARGET_FOUND' }
	| { type: 'CANCEL' }
	| { type: 'COMPLETE' }
	| { type: 'RESET' }
	| { type: 'SET_ERROR'; payload: string };

const initialState: GuideState = {
	status: 'idle',
	guideId: null,
	title: '',
	cancelable: true,
	steps: [],
	currentStepIndex: 0,
	error: null,
};

function reducer(state: GuideState, action: Action): GuideState {
	switch (action.type) {
		case 'START_GUIDE':
			return {
				...initialState,
				status: 'active',
				guideId: action.payload.guide.id,
				title: action.payload.guide.title ?? '',
				cancelable: action.payload.guide.cancelable,
				steps: action.payload.guide.steps,
				currentStepIndex: 0,
			};
		case 'NEXT_STEP': {
			const next = state.currentStepIndex + 1;
			if (next >= state.steps.length) {
				return { ...state, status: 'completed' };
			}
			return { ...state, currentStepIndex: next, status: 'active' };
		}
		case 'PREV_STEP': {
			const prev = Math.max(0, state.currentStepIndex - 1);
			return { ...state, currentStepIndex: prev, status: 'active' };
		}
		case 'GO_TO_STEP':
			if (action.payload < 0 || action.payload >= state.steps.length) return state;
			return { ...state, currentStepIndex: action.payload, status: 'active' };
		case 'WAITING_TARGET':
			return { ...state, status: 'waiting-target' };
		case 'TARGET_FOUND':
			return { ...state, status: 'active' };
		case 'CANCEL':
			return { ...state, status: 'cancelled' };
		case 'COMPLETE':
			return { ...state, status: 'completed' };
		case 'RESET':
			return initialState;
		case 'SET_ERROR':
			return { ...state, error: action.payload };
		default:
			return state;
	}
}

const GuideContext = createContext<GuideContextValue | null>(null);

interface GuideProviderProps {
	children: React.ReactNode;
	components?: GuideUIComponents;
}

export function GuideProvider({ children, components }: GuideProviderProps) {
	const ui = useMemo<GuideUIComponents>(() => components ?? {}, [components]);
	const [state, dispatch] = useReducer(reducer, initialState);

	const currentStep = useMemo(
		() => state.steps[state.currentStepIndex] ?? null,
		[state.steps, state.currentStepIndex],
	);

	const startGuide = useCallback((json: GuideJson) => {
		if (!validateGuideJson(json)) {
			dispatch({ type: 'SET_ERROR', payload: 'Invalid guide JSON' });
			return;
		}
		dispatch({ type: 'START_GUIDE', payload: json });
	}, []);

	const advance = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
	const goBack = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
	const cancel = useCallback(() => dispatch({ type: 'CANCEL' }), []);
	const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
	const goToStep = useCallback(
		(index: number) => dispatch({ type: 'GO_TO_STEP', payload: index }),
		[],
	);
	const setWaiting = useCallback(() => dispatch({ type: 'WAITING_TARGET' }), []);
	const setFound = useCallback(() => dispatch({ type: 'TARGET_FOUND' }), []);

	const value = useMemo<GuideContextValue>(
		() => ({
			...state,
			currentStep,
			startGuide,
			advance,
			goBack,
			cancel,
			reset,
			goToStep,
			setWaiting,
			setFound,
			ui,
		}),
		[
			state,
			currentStep,
			startGuide,
			advance,
			goBack,
			cancel,
			reset,
			goToStep,
			setWaiting,
			setFound,
			ui,
		],
	);

	return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide(): GuideContextValue {
	const ctx = useContext(GuideContext);
	if (!ctx) throw new Error('useGuide must be used within GuideProvider');
	return ctx;
}
