import { type ReactNode, createContext, useContext } from "react";
import type { AppServices } from "@scenespeak/core/services/app-services";

const ServicesContext = createContext<AppServices | null>(null);

export const ServicesProvider = ({ services, children }: { services: AppServices; children: ReactNode }) => (
  <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

export const useServices = (): AppServices => {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("useServices needs a ServicesProvider");
  return services;
};
