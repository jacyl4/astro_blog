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

## Cache and failure contract

- `BlogApplicationService` reads the repository once per composition scope and
  reuses the normalized post list for every public query.
- `resetBlogCache()` clears both the application cache and the repository cache.
- Repository and Content Collection failures are not converted to empty results;
  the original error and its source context propagate and fail the build.
- The former `BlogService` compatibility implementation was removed only after
  all pages and components moved to the public `@/modules/blog` entry point. No
  façade remains because retaining a second public entry would recreate the
  boundary that this module eliminates.
