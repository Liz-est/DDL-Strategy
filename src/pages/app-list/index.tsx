import { Empty, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { IDifyAppItem } from '@dify-chat/core';
import DifyAppService from '../../services/app';
import { useHistory } from 'pure-react-router';
import { MobileHeader } from '../../components/mobile/header';
import { useIsMobile } from '@dify-chat/helpers';

const appService = new DifyAppService();

export default function AppListPage() {
	const history = useHistory();
	const [list, setList] = useState<IDifyAppItem[]>([]);

	const isMobile = useIsMobile()

	useEffect(() => {
		if (!isMobile) {
			history.push('/chat');
		}
	}, [isMobile]);

	const getAppList = async () => {
		const result = await appService.getApps();
		setList(result);
	};

	useEffect(() => {
		getAppList();
	}, []);

	return (
		<div className='h-screen overflow-hidden flex flex-col'>
			<MobileHeader centerChildren={<>应用列表</>} />
			<div className="px-3 flex-1 overflow-auto">
				{
					list?.length > 0 ?
						list.map((item) => {
							return (
								<div
									key={item.id}
									className={`p-3 bg-white mt-3 border border-solid border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:text-primary`}
									onClick={() => {
										history.push(`/chat?id=${item.id}`);
									}}
								>
									<div className="w-full flex items-center">
										<div className="flex-1 overflow-hidden flex items-center">
											<span className="font-semibold">{item.info.name}</span>
											{item.info.tags
												? item.info.tags.map((tag) => {
													return (
														<Tag key={tag} className="ml-2">
															{tag}
														</Tag>
													);
												})
												: null}
										</div>
									</div>
									<div className="truncate text-sm mt-2">
										{item.info.description}
									</div>
								</div>
							);
						})
						: <div className='w-full h-full flex items-center justify-center'>
							<Empty description='暂无应用，请前往 PC 端添加' />
						</div>
				}
			</div>
		</div>
	);
}
