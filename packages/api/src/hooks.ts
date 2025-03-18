import { useEffect, useState } from "react";
import { createDifyApiInstance, DifyApi, IDifyApiOptions } from "./api";

/**
 * 创建 Dify API 实例 hook
 */
export const useDifyApi = (options?: IDifyApiOptions) => {
  const [instance, setInstance] = useState<DifyApi>();

  useEffect(() => {
    if (options) {
      setInstance(createDifyApiInstance(options));
    }
  }, [options]);

  return {
    instance,
    isInstanceReady: instance,
    // updateInstance: () => {
    //   setInstance(createDifyApiInstance(options));
    // },
  };
};
