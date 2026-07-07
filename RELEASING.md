# Releasing meticulous

Releases are automatic: **bump the version, merge to main, done.**

## How it works

- `.github/workflows/ci.yml` — every PR and push to main runs the F# tests,
  compiles the core with Fable, type-checks and bundles the extension, and
  attaches the `.vsix` as a build artifact.
- `.github/workflows/release.yml` — on every push to main it reads
  `vscode/package.json`. If the tag `v<version>` does not exist yet, it builds,
  publishes the extension, pushes the tag, and creates a GitHub release with
  the `.vsix` attached. If the tag exists, it does nothing — so ordinary merges
  that don't bump the version are safe.

## Releasing a new version

1. Bump `version` in `vscode/package.json` (e.g. `0.0.1` → `0.0.2`).
2. Merge to `main`.

## One-time setup (before the first release)

1. **Push this repo to GitHub** and update `repository.url` in
   `vscode/package.json` (it still says `CHANGE-ME`).
2. **VS Code Marketplace**: create a publisher at
   https://marketplace.visualstudio.com/manage (the `publisher` field in
   `vscode/package.json` is `meticulous-lang` — create that publisher or change
   the field to one you own). Create a Personal Access Token in Azure DevOps
   (scope: *Marketplace → Manage*), and add it as the repository secret
   **`VSCE_PAT`**.
3. **Open VSX** (optional, for VSCodium/Cursor users): create a token at
   https://open-vsx.org and add it as the secret **`OVSX_PAT`**.

The publish steps are skipped gracefully if a secret is missing, so you can set
up the Marketplace first and add Open VSX later. The GitHub release (with the
installable `.vsix`) is created either way.
