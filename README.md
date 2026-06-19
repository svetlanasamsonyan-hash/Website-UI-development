# Website-UI-development

External UI customizations for casino / iGaming websites.

The site platforms allow injecting a remote CSS (and sometimes JS) file. This
repo is the source of those files, served to the live sites through the
**GitHub → jsDelivr CDN** pipeline. There is no build step and no framework —
the deliverable is the raw CSS/JS file itself.

## Layout

One folder per target site, named after its domain:

```
<domain>/
  <domain>.css     # main stylesheet for the site
  <domain>.js      # (optional) injected script
  assets/ or img/  # (optional) icons/images referenced by the CSS
```

Current projects:

- `betrari.win/` — `betrari.win.css`

## CDN delivery (jsDelivr)

Files are served from jsDelivr using the GitHub `gh` path:

```
https://cdn.jsdelivr.net/gh/svetlanasamsonyan-hash/Website-UI-development@<ref>/<domain>/<file>
```

- `@main` — tracks the branch (cached aggressively, up to ~7 days).
- `@<commit-sha>` — pins to an exact commit. **Preferred for production** —
  immutable and cache-busts automatically.

## Workflow

1. Edit the relevant `<domain>/<domain>.css` (or `.js`).
2. Commit and push to `main`.
3. Use the pinned jsDelivr URL (`@<new-commit-sha>`) for the changed file.

See [CLAUDE.md](CLAUDE.md) for full guidance.
