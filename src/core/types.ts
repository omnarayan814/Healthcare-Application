import type { ComponentType, LazyExoticComponent } from 'react';
import type { Reducer } from '@reduxjs/toolkit';

export interface ModuleRoute {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: LazyExoticComponent<ComponentType<any>>;
}

export interface MicroModule {
  id: string;
  name: string;
  version: string;
  description: string;
  routes: ModuleRoute[];
  reducers?: Record<string, Reducer>;
  initialize?: () => Promise<void> | void;
}
