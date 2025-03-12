import { IMessageFileItem } from '../../types';

interface IMessageFileListProps {
  /**
   * 消息附件列表
   */
  files?: IMessageFileItem[];
}

/**
 * 消息附件列表展示组件
 */
export default function MessageFileList(props: IMessageFileListProps) {
  const { files } = props;

  if (!files?.length) {
    return null;
  }

  return (
    <>
      {files.map((item: IMessageFileItem) => {
        return (
          <img
            src={item.url}
            key={item.id}
            alt={item.filename}
            className="max-w-full"
          />
        );
      })}
    </>
  );
}
