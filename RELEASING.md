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

1. **Push this repo to GitHub.** (`repository.url` in `vscode/package.json`
   already points at github.com/binerdy/meticulous.)
2. **Create a Marketplace publisher** at
   https://marketplace.visualstudio.com/manage — sign in with a **personal**
   Microsoft account. The `publisher` field in `vscode/package.json` is
   `meticulous-lang`; create that ID or change the field to one you own.
3. Pick a publishing path below.

## Three ways to publish to the VS Code Marketplace

### A. Manual upload — no token needed at all

Go to https://marketplace.visualstudio.com/manage, click **…** next to your
publisher → **New extension → Visual Studio Code**, and upload the packaged
`vscode/meticulous-<version>.vsix` in the browser. Subsequent versions:
**… → Update**. The GitHub release (with the `.vsix` attached) is still created
automatically on every version bump, so automation keeps working end-to-end —
only the Marketplace upload itself is a manual drag-and-drop.

### B. Personal Access Token (automated; works until PATs retire Dec 2026)

The PAT is **not created on the Marketplace page** — it lives in Azure DevOps,
which is why it's hard to find:

1. Sign in at https://dev.azure.com with the **same Microsoft account** as the
   publisher. If you've never used Azure DevOps, let it create its default
   organization first (the PAT menu doesn't exist without one).
   ⚠ Use a personal account: on tenant-managed accounts (e.g. a university
   account) the organization's policy often blocks global PAT creation
   entirely — that is the usual reason "there's no PAT I can use."
2. Top-right: **User settings (gear icon) → Personal access tokens → New Token**.
3. Name it anything; **Organization: "All accessible organizations"** (a
   common mistake is picking a specific org — publishing then fails 401);
   **Scopes: Custom defined → "Show all scopes" → Marketplace → ✓ Manage**.
4. Copy the token and save it as the GitHub repository secret **`VSCE_PAT`**
   (repo → Settings → Secrets and variables → Actions).

From then on, `release.yml` publishes automatically on every version bump.

### C. Entra ID / managed identity (Microsoft's long-term path)

PATs retire on 1 Dec 2026. The replacement (`vsce publish --azure-credential`
with workload identity federation) requires an Azure subscription and a managed
identity — reasonable for organisations, heavyweight for a personal project.
When the time comes, the release workflow can be switched to `azure/login` with
OIDC; until then A or B is fine.

## Open VSX (optional, for VSCodium/Cursor users)

Create a token at https://open-vsx.org (GitHub sign-in) and add it as the
secret **`OVSX_PAT`**. Much simpler than the Microsoft side.

The publish steps in `release.yml` are skipped gracefully when a secret is
missing, so any combination works — the GitHub release with the installable
`.vsix` is created either way.
