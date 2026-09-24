# Repository working agreements

- This repository is the MIT-licensed source for workhub-cli. User workspaces and business data are not source files.
- Before editing, inspect Git status and preserve unrelated user changes.
- After implementing a coherent change, run the relevant checks, update documentation, and commit the change with a clear message. The owner has requested ongoing Git version management and GitHub synchronization for this project.
- Push completed, validated changes to the configured origin unless the current user request limits work to local changes. Do not force-push, rewrite published history, or include unrelated changes.
- Do not commit credentials, local machine configuration, test workspace data, node_modules, dist, or temporary packages.
- Run `npm run check`, `npm run build`, and `npm test` for implementation changes. Packaging changes should verify `npm pack` contains the required templates and LICENSE.
- Keep release notes in CHANGELOG.md. Use version tags for reviewed release milestones; do not tag every implementation commit or publish npm packages without a release request.
- Preserve Trellis/work/code separation and explicit target directories when exercising the CLI. Use temporary roots and WK_CONFIG_PATH for tests.
