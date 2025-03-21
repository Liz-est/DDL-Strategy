import { IMessageFileItem } from "@dify-chat/api";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

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
          <PhotoProvider>
            <PhotoView src={item.url}>
              <img
                src={item.url}
                key={item.id}
                alt={item.filename}
                className="max-w-full cursor-zoom-in"
              />
            </PhotoView>
          </PhotoProvider>
        );
      })}
    </>
  );
}
