import { Registry } from "@kernel/di/Registry";
import { Constructor } from "@shared/types/Constructor";

export function Injectable(): ClassDecorator {
  return (target: any) => {
    Registry.getInstance().register(target as Constructor);
  };
}
