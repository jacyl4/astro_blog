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

  it('aborts the PageContext signal so page-scoped requests can be cancelled', () => {
    let capturedSignal: AbortSignal | undefined;
    let abortEvents = 0;
    const lifecycle = new PageLifecycle([
      {
        name: 'request',
        mount(context) {
          capturedSignal = context.signal;
          context.signal.addEventListener('abort', () => {
            abortEvents += 1;
          }, { once: true });
        },
      },
    ]);

    lifecycle.mount({} as Document, {} as Window);
    expect(capturedSignal?.aborted).toBe(false);
    lifecycle.destroy();
    expect(capturedSignal?.aborted).toBe(true);
    expect(abortEvents).toBe(1);
  });

  it('uses the signal to remove an injected page listener during destroy', () => {
    const target = new EventTarget();
    let calls = 0;
    const lifecycle = new PageLifecycle([
      {
        name: 'fault-injected-listener',
        mount(context) {
          target.addEventListener('fault', () => {
            calls += 1;
          }, { signal: context.signal });
        },
      },
    ]);

    lifecycle.mount({} as Document, {} as Window);
    target.dispatchEvent(new Event('fault'));
    lifecycle.destroy();
    target.dispatchEvent(new Event('fault'));

    expect(calls).toBe(1);
  });
});
