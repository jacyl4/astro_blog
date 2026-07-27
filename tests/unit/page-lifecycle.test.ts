import { describe, expect, it } from 'vitest';
import { PageLifecycle } from '../../src/client/runtime/PageLifecycle';
import type { PageController } from '../../src/client/runtime/types';

describe('PageLifecycle', () => {
  it('mounts in order, destroys in reverse order, and advances generation', () => {
    const calls: string[] = [];
    const controller = (name: string): PageController => ({
      name,
      mount(context) {
        calls.push(`mount:${name}:${context.generation}`);
        return () => calls.push(`destroy:${name}:${context.generation}`);
      },
    });
    const lifecycle = new PageLifecycle([controller('a'), controller('b')]);
    const document = {} as Document;
    const window = {} as Window;

    lifecycle.mount(document, window);
    lifecycle.mount(document, window);
    lifecycle.destroy();

    expect(calls).toEqual([
      'mount:a:1',
      'mount:b:1',
      'destroy:b:1',
      'destroy:a:1',
      'mount:a:2',
      'mount:b:2',
      'destroy:b:2',
      'destroy:a:2',
    ]);
  });

  it('isolates controller failures and aborts stale contexts', () => {
    let firstActive = true;
    const lifecycle = new PageLifecycle([
      {
        name: 'capture',
        mount(context) {
          firstActive = context.isActive();
          return () => {
            firstActive = context.isActive();
          };
        },
      },
      {
        name: 'failure',
        mount() {
          throw new Error('expected failure');
        },
      },
    ]);

    lifecycle.mount({} as Document, {} as Window);
    expect(firstActive).toBe(true);
    lifecycle.destroy();
    expect(firstActive).toBe(false);
    expect(lifecycle.snapshot().errors).toEqual([
      { controller: 'failure', phase: 'mount', message: 'expected failure' },
    ]);
  });

  it('prevents a promise completed after destroy from applying stale work', async () => {
    let applied = false;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const lifecycle = new PageLifecycle([
      {
        name: 'async',
        mount(context) {
          void pending.then(() => {
            if (context.isActive()) applied = true;
          });
        },
      },
    ]);

    lifecycle.mount({} as Document, {} as Window);
    lifecycle.destroy();
    release();
    await pending;
    await Promise.resolve();

    expect(applied).toBe(false);
  });
});
