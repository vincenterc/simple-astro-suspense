import { defineMiddleware } from 'astro/middleware';

type SuspenseChunk = { id: number; chunk: string };

export const onRequest = defineMiddleware(async (ctx, next) => {
  let streamController: ReadableStreamDefaultController<SuspenseChunk>;
  const stream = new ReadableStream<SuspenseChunk>({
    start(controller) {
      streamController = controller;
    },
  });

  const pending = new Set<Promise<string>>();
  ctx.locals.suspend = (promise) => {
    const id = pending.size;
    pending.add(promise);
    promise.then((chunk) => {
      pending.delete(promise);
      streamController.enqueue({ id, chunk });
      if (pending.size === 0) {
        streamController.close();
      }
    });
    return id;
  };

  const response = await next();
  if (!response.headers.get('content-type')?.startsWith('text/html')) {
    return response;
  }

  async function* render() {
    for await (const chunk of response.body as ReadableStream<ArrayBuffer>) {
      yield chunk;
    }

    for await (const { id, chunk } of stream) {
      yield `
        <template data-suspense="${id}">${chunk}</template>
        <script>
          (() => {
            const template = document.querySelector('template[data-suspense="${id}"]');
            const fallback = document.querySelector('[data-fallback="${id}"]');
            fallback.replaceWith(template.content);
          })();
        </script>
      `;
    }
  }

  // @ts-expect-error 'AsyncGenerator' is not assignable to ReadableStream.
  return new Response(render(), { headers: response.headers });
});
