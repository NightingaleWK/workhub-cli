# Changelog

## Unreleased

- Require proactive release decision briefs after completed OpenSpec changes; version bumps, GitHub tags, and npm publication remain owner decisions.
- Document the solo-maintainer OpenSpec workflow, Git synchronization, and owner-controlled npm releases; remove Hyper-V interactive acceptance from the project backlog.
- Reconcile current documentation with the implementation and registry status; retain superseded plans and validation records under docs/history.


## 0.1.2 — 2026-09-24

- Group init previews into work identity, labeled Trellis/work/code destinations, management actions, and manually created VS Code workspaces; separate long paths from labels.

- Detect Trellis during `wk install` and offer consent-based global installation of `@mindfoldhq/trellis@latest`.
- Support explicit `--install-trellis` for automation, verify the installed launcher, and discover npm global packages even when their bin directory is not yet on PATH.

- Replace boxed execution plans with a left flow line and grouped configuration details.
- Show the Git user name and actual create/preserve/link directory states before confirmation.
- Allow returning to edit install/init inputs without writing files; retain prior answers as defaults.

## 0.1.1 — 2026-09-24

- First npm registry release.
- Fix Enter-to-accept for the detected Git user name and isolate tests from machine Git configuration.

- Require Trellis for every work as the Codex primary directory and AGENTS.md entry point; only work/code remain optional.
- Normalize CLI/API component requests, default omitted CLI components to work + Trellis, and support `--components none` for Trellis-only work.
- Report legacy records missing Trellis without silently migrating or overwriting their files.
- Capture the global Git user name during install and pass it to every new `trellis init -u`.

- Fix Windows 8.3 short-path comparison so GitHub-hosted runners and long-path Git output identify the same repository correctly.
- Add a regression test using Windows filesystem short-path aliases and keep both CI matrix jobs running independently.

## 0.1.0 — 2026-09-24

- Initial Windows-first WorkHub CLI: install, init, list, show, and check.
- Interactive Chinese prompts and non-interactive JSON mode.
- Separate work, code, and Trellis repositories with existing-repository association.
- Work registry, generated annual indexes, AI entry instructions and task handoff.
- Path containment checks, write locks, operation journals and interrupted-operation recovery.
- Official Trellis 0.6.17 integration verified in isolated workspaces.
- MIT open-source license.

Archive automation, operations knowledge authoring, and npm registry publication are not part of this release.
