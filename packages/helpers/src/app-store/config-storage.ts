// 定义配置项的接口
export interface IDifyAppItem {
  /**
   * 唯一标识
   */
  id: string;
  /**
   * Dify 应用基本信息
   */
  info: {
    /**
     * 应用名称
     */
    name: string;
    /**
     * 应用描述
     */
    description: string;
    /**
     * 应用标签
     */
    tags: string[];
  }
  /**
   * 请求配置
   */
  requestConfig: {
    /**
     * 请求地址
     */
    apiBase: string
    /**
     * Dify APP API 密钥
     */
    apiKey: string
  }
}

// 抽象类，定义存储操作的接口
abstract class DifyAppStore {
  abstract getApps(): Promise<IDifyAppItem[]>;
  abstract getApp(id: string): Promise<IDifyAppItem | undefined>;
  abstract addApp(app: IDifyAppItem): Promise<void>;
  abstract updateApp(app: IDifyAppItem): Promise<void>;
  abstract deleteApp(id: string): Promise<void>;
}

export default DifyAppStore;