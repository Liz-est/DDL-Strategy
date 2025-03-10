import { useEffect, useState } from "react";
import { createDifyApiInstance, DifyApi, IDifyApiOptions } from "./api";
import { getVars } from "@dify-chat/helpers";

const isInstanceReady = () => {
  const vars = getVars();
  return !!vars.DIFY_API_KEY && !!vars.DIFY_API_BASE;
};

/**
 * 创建 Dify API 实例 hook
 */
export const useDifyApi = (options: IDifyApiOptions) => {
  const [instance, setInstance] = useState<DifyApi>();

  useEffect(() => {
    if (options && isInstanceReady()) {
      setInstance(createDifyApiInstance(options));
    }
  }, [options]);

  return {
    instance,
    isInstanceReady: isInstanceReady() && instance,
    updateInstance: () => {
      setInstance(createDifyApiInstance(options));
    },
  };
};
