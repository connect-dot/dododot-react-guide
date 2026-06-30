import { GuideJson, validateGuideJson } from './types';

interface ParsedGuideResponse {
	text: string;
	guide: GuideJson | null;
}

export function parseGuideResponse(responseText: string): ParsedGuideResponse {
	const codeBlockRegex = /```guide\s*\n?([\s\S]*?)\n?```/;
	const match = responseText.match(codeBlockRegex);

	if (match) {
		try {
			const parsed = JSON.parse(match[1]);
			if (validateGuideJson(parsed)) {
				return {
					text: responseText.replace(codeBlockRegex, '').trim(),
					guide: parsed,
				};
			}
		} catch {
			// fall through
		}
	}

	try {
		const parsed = JSON.parse(responseText);
		if (validateGuideJson(parsed)) {
			return { text: '', guide: parsed };
		}
	} catch {
		// fall through
	}

	return { text: responseText, guide: null };
}
