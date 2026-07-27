import type {
  ControllerCleanup,
  LifecycleSnapshot,
  PageContext,
  PageController,
} from './types';

export class PageLifecycle {
  private generation = 0;
  private abortController: AbortController | null = null;
  private cleanups: Array<{ controller: string; cleanup: ControllerCleanup }> = [];
  private context: PageContext | null = null;
  private errors: LifecycleSnapshot['errors'] = [];

  constructor(private readonly controllers: PageController[]) {}

  mount(document: Document, window: Window): void {
    this.destroy();
    this.generation += 1;
    const generation = this.generation;
    this.abortController = new AbortController();
    const context: PageContext = {
      generation,
      signal: this.abortController.signal,
      document,
      window,
      isActive: () =>
        this.context?.generation === generation
        && this.abortController?.signal.aborted === false,
    };
    this.context = context;

    for (const controller of this.controllers) {
      try {
        const cleanup = controller.mount(context);
        if (cleanup) this.cleanups.push({ controller: controller.name, cleanup });
      } catch (error) {
        this.recordError(controller.name, 'mount', error);
      }
    }
  }

  resize(): void {
    const context = this.context;
    if (!context || context.signal.aborted) return;
    for (const controller of this.controllers) {
      if (!controller.resize) continue;
      try {
        controller.resize(context);
      } catch (error) {
        this.recordError(controller.name, 'resize', error);
      }
    }
  }

  destroy(): void {
    this.abortController?.abort();
    for (const item of [...this.cleanups].reverse()) {
      try {
        item.cleanup();
      } catch (error) {
        this.recordError(item.controller, 'destroy', error);
      }
    }
    this.cleanups = [];
    this.context = null;
    this.abortController = null;
  }

  snapshot(): LifecycleSnapshot {
    return {
      generation: this.generation,
      mounted: Boolean(this.context && !this.context.signal.aborted),
      controllerCount: this.controllers.length,
      controllerNames: this.controllers.map((controller) => controller.name),
      errors: [...this.errors],
    };
  }

  private recordError(
    controller: string,
    phase: 'mount' | 'destroy' | 'resize',
    error: unknown,
  ): void {
    this.errors.push({
      controller,
      phase,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
