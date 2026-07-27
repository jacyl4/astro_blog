export interface PageContext {
  generation: number;
  signal: AbortSignal;
  document: Document;
  window: Window;
  isActive(): boolean;
}

export type ControllerCleanup = () => void;

export interface PageController {
  name: string;
  mount(context: PageContext): void | ControllerCleanup;
  resize?(context: PageContext): void;
}

export interface LifecycleSnapshot {
  generation: number;
  mounted: boolean;
  controllerCount: number;
  controllerNames: string[];
  errors: Array<{ controller: string; phase: 'mount' | 'destroy' | 'resize'; message: string }>;
}
