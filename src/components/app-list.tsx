import { MoreOutlined } from "@ant-design/icons";
import { IDifyAppItem } from "@dify-chat/helpers"
import { Tag } from "antd";

interface IAppListProps {
  /**
   * 选中的应用 ID
   */
  selectedId?: string,
  /**
   * 选中的应用 ID 变化时的回调
   */
  onSelectedChange?: (selectedId: string, selectedAppInfo: IDifyAppItem)=>void,
  /**
   * 应用列表
   */
  list: IDifyAppItem[]
}

/**
 * Dify 应用列表
 */
export default function AppList(props: IAppListProps) {
  const { selectedId, onSelectedChange, list } = props;

  return <div>
    {
      list.map((item)=>{
        const isSelected = selectedId === item.id
        return (
          <div key={item.id} className={`p-3 bg-white mt-3 border border-solid border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:text-primary ${isSelected ? 'text-primary border-primary' : ''}`}
            onClick={()=>{
              onSelectedChange?.(item.id, item)
            }}
          >
            <div className="w-full flex items-center">
              <div className="flex-1 overflow-hidden flex items-center">
                <span className="font-semibold">
                  {item.info.name}
                </span>
                {
                  item.info.tags?
                  item.info.tags.map((tag)=>{
                    return (
                      <Tag key={tag} className="ml-2">
                        {tag}
                      </Tag>
                    )
                  })
                  : null
                }
              </div>
              <MoreOutlined />
            </div>
            <div className="truncate text-sm mt-2">
              {item.info.description}
            </div>
          </div>
        )
      })
    }
  </div>
}