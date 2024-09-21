import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const pending = new Set<Promise<string>>();
  ctx.locals.suspend = (promise) => {
    const id = pending.size;
    pending.add(promise);
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

    for (const [id, promise] of [...pending].entries()) {
      yield `
        <template data-suspense="${id}">${await promise}</template>
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
