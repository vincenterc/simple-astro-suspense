# Simple Suspense with Astro

Implement a simple suspense component by using [Astro](https://astro.build/) to suspend components with fallback contents.

## How to use

```bash
npm i
npm run dev
```

## Key Files

```sh
src/
  components/
    suspense.astro # the suspense component
  middleware.ts # the middleware that handles the response stream
```

### `Suspense`

Pass any suspended content as children of the `<Suspense>` component, and use `slot="fallback"` to define your fallback:

```astro
---
import Suspense from 'path to/components/suspense.astro';
---

<Suspense>
  <Component />
  <p slot="fallback">Loading...</p>
</Suspense>
```
