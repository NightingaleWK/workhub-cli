# Repository working agreements

- This repository is the MIT-licensed source for workhub-cli. User workspaces and business data are not source files.
- Before editing, inspect Git status and preserve unrelated user changes.
- This is a solo-maintained project. Use the repository's OpenSpec `spec-driven` workflow for future feature and behavior changes; keep the proposal, design, specs, and tasks aligned with the implementation. A pull request or separate reviewer is not a default completion gate.
- For each completed OpenSpec change, finish the relevant spec sync/archive, run the relevant checks, update documentation and CHANGELOG.md, then commit the coherent change with a clear message and push it to the configured origin unless the current user request limits work to local changes. Do not force-push, rewrite published history, or include unrelated changes.
- Do not commit credentials, local machine configuration, test workspace data, node_modules, dist, or temporary packages.
- Run `npm run check`, `npm run build`, and `npm test` for implementation changes. Packaging changes should verify `npm pack` contains the required templates and LICENSE.
- Git commits and pushes track completed work; package version bumps and version tags mark owner-selected release milestones. Publish an npm package only when the owner explicitly requests that release.
- Hyper-V interactive testing is performed manually by the owner. Do not keep it as an agent acceptance task or claim it passed without the owner's result.
- Preserve Trellis/work/code separation and explicit target directories when exercising the CLI. Use temporary roots and WK_CONFIG_PATH for tests.
- Every new work must create or link a real Trellis space with AGENTS.md and a task entry. Only work/code are optional. Never allow CLI flags or programmatic calls to bypass the mandatory Trellis component.
