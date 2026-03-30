import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { ServiceId, ServiceConfig } from "@/lib/service-config";
import { SERVICES } from "@/lib/service-config";

interface ServiceContextType {
  activeService: ServiceConfig;
  setService: (id: ServiceId) => void;
  canSwitch: boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

function getStorageKey(userId?: string) {
  return userId ? `oasis-service-${userId}` : "oasis-service-default";
}

export function ServiceProvider({
  children,
  userId,
  userService,
  canAccessAllServices,
}: {
  children: ReactNode;
  userId?: string;
  userService?: string;
  canAccessAllServices?: boolean;
}) {
  const defaultServiceId = (userService as ServiceId) ?? "dev";

  const [activeServiceId, setActiveServiceId] = useState<ServiceId>(() => {
    if (!canAccessAllServices) return defaultServiceId;
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored && stored in SERVICES) return stored as ServiceId;
    } catch {}
    return defaultServiceId;
  });

  useEffect(() => {
    if (!canAccessAllServices) {
      setActiveServiceId(defaultServiceId);
      return;
    }
    try {
      const stored = localStorage.getItem(getStorageKey(userId));
      if (stored && stored in SERVICES) {
        setActiveServiceId(stored as ServiceId);
      } else {
        setActiveServiceId(defaultServiceId);
      }
    } catch {
      setActiveServiceId(defaultServiceId);
    }
  }, [userId, defaultServiceId, canAccessAllServices]);

  const setService = useCallback(
    (id: ServiceId) => {
      if (!canAccessAllServices) return;
      setActiveServiceId(id);
      try {
        localStorage.setItem(getStorageKey(userId), id);
      } catch {}
    },
    [canAccessAllServices, userId]
  );

  return (
    <ServiceContext.Provider
      value={{
        activeService: SERVICES[activeServiceId],
        setService,
        canSwitch: !!canAccessAllServices,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useService must be used within ServiceProvider");
  return ctx;
}
