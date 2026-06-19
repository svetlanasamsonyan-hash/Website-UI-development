# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

`Website-UI-development` hosts **external UI customizations for casino / iGaming
websites**. The site platforms allow injecting a remote CSS (and sometimes JS)
file; this repo is the source of those files, served to the live sites through
the **GitHub → jsDelivr CDN** pipeline.

There is no build step, no framework, and no app to run. The deliverable is the
raw CSS/JS file itself, referenced by a CDN URL on the target site.

## Repository layout

One folder per target site, named after its domain. Each folder holds the
file(s) injected into that site:

```
<domain>/
  <domain>.css     # main stylesheet for the site
  <domain>.js      # (optional) injected script
  assets/ or img/  # (optional) icons/images referenced by the CSS
```

Current projects:

- `betrari.win/` — `betrari.win.css`

When adding a new site, create a `<domain>/` folder and put `<domain>.css`
inside it, matching the existing naming convention.

## CDN delivery (jsDelivr)

Files are served from jsDelivr using the GitHub gh path:

```
https://cdn.jsdelivr.net/gh/svetlanasamsonyan-hash/Website-UI-development@<ref>/<domain>/<file>
```

- `@main` — tracks the branch. Convenient, but jsDelivr caches branch URLs
  aggressively (up to ~7 days), so a push is **not** reflected immediately.
- `@<commit-sha>` — pins to an exact commit. **Preferred for production** —
  it is immutable and cache-busts automatically, so the site picks up the new
  version as soon as you update the URL.

Example (pinned):

```
https://cdn.jsdelivr.net/gh/svetlanasamsonyan-hash/Website-UI-development@8107433/betrari.win/betrari.win.css
```

After pushing a change, hand back the **pinned jsDelivr URL for the new commit**
so it can be pasted into the site's custom-CSS field.

## Workflow

1. Edit the relevant `<domain>/<domain>.css` (or `.js`).
2. Commit and push to `main`.
3. Provide the pinned jsDelivr URL (`@<new-commit-sha>`) for the changed file.

## Conventions

- Keep each site's overrides self-contained in its own folder.
- CSS is injected on top of the platform's own styles — prefer specific
  selectors and `!important` only where the platform's CSS forces it.
- The `ui-developer` skill covers this casino/iGaming CSS-injection workflow;
  use it when building or merging UI customizations here.
