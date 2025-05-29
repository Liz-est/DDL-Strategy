import { IConfig } from "@/config";
import { AppModeEnums, IDifyAppItem } from "@dify-chat/core";

/**
 * Convert the config to the single app config
 */
export const configToSingleAppConfig = (
	config: IConfig,
): Omit<IDifyAppItem, "id"> => {
	return {
		requestConfig: {
			apiBase: config.apiBase,
			apiKey: config.apiSecret,
		},
		info: {
			name: "",
			description: "",
			mode: AppModeEnums.CHATBOT,
			tags: [],
		},
		answerForm: {
			enabled: config.answerFormEnabled,
			feedbackText: config.answerFormFeedbackText,
		},
		inputParams: {
			enableUpdateAfterCvstStarts: config.enableUpdateInputAfterCvstStarts,
		},
		extConfig: {
			conversation: {
				openingStatement: {
					displayMode: "default",
				},
			},
		},
	};
};
