# Deno Lockfile Notice

## What to do if you get a lockfile error after a Deno upgrade

If you see an error like:

```
The lock file was generated with an older version of Deno and is not compatible with the current version.
```

**You have two options:**

1. **Delete `deno.lock`**
   - This will loosen dependency pinning. Deno will fetch the latest compatible versions on next run.
2. **Regenerate `deno.lock` with the correct Deno version**
   - Make sure you are using the same Deno version as specified in the Dockerfile (currently `1.40.4`).
   - Run:
     ```
     deno cache --lock=deno.lock --lock-write server.ts
     ```

## Best Practice

- Always generate and commit `deno.lock` using the same Deno version as in your Dockerfile to avoid compatibility issues.
- Update this notice if the Dockerfile Deno version changes.
