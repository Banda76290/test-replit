import { useState, useCallback } from "react";
import {
  loadNavConfig,
  saveNavConfig,
  type NavConfigMap,
  type UserRoleId,
} from "@/lib/nav-config";
import type { ServiceId } from "@/lib/service-config";

export function useNavConfig() {
  const [config, setConfig] = useState<NavConfigMap>(loadNavConfig);

  const toggle = useCallback(
    (serviceId: ServiceId, roleId: UserRoleId, href: string, visible: boolean) => {
      setConfig((prev) => {
        const next: NavConfigMap = {
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            [roleId]: {
              ...prev[serviceId]?.[roleId],
              [href]: visible,
            },
          },
        };
        saveNavConfig(next);
        return next;
      });
    },
    []
  );

  const resetService = useCallback((serviceId: ServiceId) => {
    setConfig((prev) => {
      const next = { ...prev };
      delete next[serviceId];
      saveNavConfig(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setConfig({});
    saveNavConfig({});
  }, []);

  return { config, toggle, resetService, resetAll };
}
