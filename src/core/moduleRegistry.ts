import type { MicroModule, ModuleRoute } from './types';
import type { Reducer } from '@reduxjs/toolkit';

class ModuleRegistry {
  private readonly modules = new Map<string, MicroModule>();
  private readonly initialized = new Set<string>();

  register(module: MicroModule): void {
    if (this.modules.has(module.id)) {
      if (import.meta.env.DEV) {
        console.warn(`[ModuleRegistry] Module "${module.id}" already registered — skipping.`);
      }
      return;
    }
    this.modules.set(module.id, module);
    if (import.meta.env.DEV) {
      console.debug(`[ModuleRegistry] Registered module: ${module.id}@${module.version}`);
    }
  }

  async initialize(id: string): Promise<void> {
    if (this.initialized.has(id)) return;
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`[ModuleRegistry] Module "${id}" is not registered.`);
    await mod.initialize?.();
    this.initialized.add(id);
  }

  async initializeAll(): Promise<void> {
    await Promise.all([...this.modules.keys()].map(id => this.initialize(id)));
  }

  getModule(id: string): MicroModule | undefined {
    return this.modules.get(id);
  }

  getAllModules(): MicroModule[] {
    return [...this.modules.values()];
  }

  getAllRoutes(): ModuleRoute[] {
    return this.getAllModules().flatMap(m => m.routes);
  }

  getAllReducers(): Record<string, Reducer> {
    return this.getAllModules().reduce<Record<string, Reducer>>(
      (acc, m) => ({ ...acc, ...m.reducers }),
      {},
    );
  }

  isRegistered(id: string): boolean {
    return this.modules.has(id);
  }
}

export const moduleRegistry = new ModuleRegistry();
