import { useXAgent, useXChat, XStream } from "@ant-design/x";
import { IAgentMessage, IMessageFileItem } from "../types";
import { EventEnum, IAgentThought, IChunkChatCompletionResponse, IErrorEvent, IGetAppParametersResponse } from "@dify-chat/api";
import { isTempId } from "@dify-chat/helpers";
import { IWorkflowNode } from "../components/workflow-logs";
import { RESPONSE_MODE, USER } from "../config";

export const useX = (options: {
	latestProps: any
	target: string,
	getNextSuggestions: (messageId: string) => void,
	appParameters: IGetAppParametersResponse,
	filesRef: any,
	abortRef: any,
	getConversationMessages: (conversationId: string) => void,
  onConversationIdChange: (id: string) => void;
}) => {
	const { latestProps, target, appParameters, getNextSuggestions, filesRef, abortRef, getConversationMessages, onConversationIdChange } = options

	const [agent] = useXAgent<IAgentMessage>({
		request: async ({ message }, { onSuccess, onUpdate, onError }) => {
			// 发送消息
			const response = await latestProps.current.difyApi.sendMessage({
				inputs: {
					target,
				},
				conversation_id: !isTempId(latestProps.current.conversationId)
					? latestProps.current.conversationId
					: undefined,
				files: filesRef.current || [],
				user: USER,
				response_mode: RESPONSE_MODE,
				query: message?.content as string,
			});

			let result = '';
			const files: IMessageFileItem[] = [];
			const workflows: IAgentMessage['workflows'] = {};
			const agentThoughts: IAgentThought[] = [];

			const readableStream = XStream({
				readableStream: response.body as NonNullable<ReadableStream>,
			});

			const reader = readableStream.getReader();
			abortRef.current = () => {
				reader?.cancel();
			};

			while (reader) {
				const { value: chunk, done } = await reader.read();
				if (done) {
					onSuccess({
						content: result,
						files,
						workflows,
						agentThoughts,
					});
					break;
				}
				if (!chunk) continue;
				if (chunk.data) {
					let parsedData = {} as {
						id: string;
						task_id: string;
						position: number;
						tool: string;
						tool_input: string;
						observation: string;
						message_files: string[];

						event: IChunkChatCompletionResponse['event'];
						answer: string;
						conversation_id: string;
						message_id: string;

						// 类型
						type: 'image';
						// 图片链接
						url: string;

						data: {
							// 工作流节点的数据
							id: string;
							node_type: IWorkflowNode['type'];
							title: string;
							inputs: string;
							outputs: string;
							process_data: string;
							elapsed_time: number;
							execution_metadata: IWorkflowNode['execution_metadata'];
						};
					};
					try {
						parsedData = JSON.parse(chunk.data);
					} catch (error) {
						console.error('解析 JSON 失败', error);
					}
					if (parsedData.event === EventEnum.MESSAGE_END) {
						onSuccess({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
						// 刷新消息列表
						getConversationMessages(parsedData.conversation_id)
						onConversationIdChange(parsedData.conversation_id)
						// const conversation_id = parsedData.conversation_id;
						// 如果有对话 ID，跟当前的对比一下
						// if (conversation_id && isTempId(conversationId)) {
						//   // 通知外部组件，对话 ID 变更，外部组件需要更新对话列表
						//   onConversationIdChange(conversation_id);
						// }
						// 如果开启了建议问题，获取下一轮问题建议
						if (appParameters?.suggested_questions_after_answer.enabled) {
							getNextSuggestions(parsedData.message_id);
						}
					}
					const innerData = parsedData.data;
					if (parsedData.event === EventEnum.WORKFLOW_STARTED) {
						workflows.status = 'running';
						workflows.nodes = [];
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					} else if (parsedData.event === EventEnum.WORKFLOW_FINISHED) {
						console.log('工作流结束', parsedData);
						workflows.status = 'finished';
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					} else if (parsedData.event === EventEnum.WORKFLOW_NODE_STARTED) {
						console.log('节点开始', parsedData);
						workflows.nodes = [
							...(workflows.nodes || []),
							{
								id: innerData.id,
								status: 'running',
								type: innerData.node_type,
								title: innerData.title,
							} as IWorkflowNode,
						];
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					} else if (parsedData.event === EventEnum.WORKFLOW_NODE_FINISHED) {
						workflows.nodes = workflows.nodes?.map((item) => {
							if (item.id === innerData.id) {
								return {
									...item,
									status: 'success',
									inputs: innerData.inputs,
									outputs: innerData.outputs,
									process_data: innerData.process_data,
									elapsed_time: innerData.elapsed_time,
									execution_metadata: innerData.execution_metadata,
								};
							}
							return item;
						});
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					}
					if (parsedData.event === EventEnum.MESSAGE_FILE) {
						result += `<img src=""${parsedData.url} />`;
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					}
					if (
						parsedData.event === EventEnum.MESSAGE ||
						parsedData.event === EventEnum.AGENT_MESSAGE
					) {
						const text = parsedData.answer;
						result += text;
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					}
					if (parsedData.event === EventEnum.ERROR) {
						onError({
							name: `${(parsedData as unknown as IErrorEvent).status}: ${(parsedData as unknown as IErrorEvent).code}`,
							message: (parsedData as unknown as IErrorEvent).message,
						});
					}
					if (parsedData.event === EventEnum.AGENT_THOUGHT) {
						agentThoughts.push({
							conversation_id: parsedData.conversation_id,
							id: parsedData.id as string,
							task_id: parsedData.task_id,
							position: parsedData.position,
							tool: parsedData.tool,
							tool_input: parsedData.tool_input,
							observation: parsedData.observation,
							message_files: parsedData.message_files,
							message_id: parsedData.message_id,
						});
						onUpdate({
							content: result,
							files,
							workflows,
							agentThoughts,
						});
					}
				} else {
					console.log('没有数据', chunk);
					continue;
				}
			}
		},
	});

	const { onRequest, messages, setMessages } = useXChat({
		agent,
	});

	return { agent, onRequest, messages, setMessages }
}