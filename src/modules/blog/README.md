# Blog Module

Public consumers import only from `@/modules/blog`.

Dependency direction:

```text
pages/components
  -> public index
  -> application service
  -> domain selectors + BlogRepository port
  -> Astro content repository adapter
```

The domain layer contains no Astro imports. The infrastructure adapter is the only
blog file allowed to access `astro:content`.
