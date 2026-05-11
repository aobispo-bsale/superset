# Bsale Superset Fork — Changelog

All **Bsale-specific** changes layered on top of the Apache Superset fork
([`aobispo-bsale/superset`](https://github.com/aobispo-bsale/superset)) are documented
in this file. It is intentionally separate from the upstream `CHANGELOG.md`
(which tracks Apache Superset releases) so that the Bsale patch set is easy to
audit when rebasing onto newer Superset versions.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/) with a
`-bsale.N` pre-release suffix identifying the N-th iteration on top of an
upstream release.

Each release maps 1:1 to an ECR tag in the `superset-frontend-assets`
repository (e.g. version `6.0.0-bsale.1` is published as
`239630721544.dkr.ecr.us-east-1.amazonaws.com/superset-frontend-assets:6.0.0-bsale.1`).

## [Unreleased]

## [6.0.0-bsale.1] - 2026-05-11

Initial Bsale fork snapshot on top of upstream Apache Superset `6.0.0`.

### Added

- **sankey**: new `nodeOrder` control in the chart's controls panel — allows
  manual ordering of Sankey nodes by typing a comma-separated list of node
  names. Nodes not listed fall to the end. Empty / whitespace-only values
  are treated as "no order applied" for backwards compatibility.
- **drill-detail**: CSV / XLSX download buttons in the "Drill to detail" modal.
  Port of upstream PR
  [#37109](https://github.com/apache/superset/pull/37109) (frontend-only —
  no backend changes required).
- **build**: `Dockerfile.assets` and `Makefile.bsale` for building the
  frontend assets bundle and publishing it to the Bsale ECR repository
  `superset-frontend-assets`. Targets:
  - `make -f Makefile.bsale build-and-push-staging` →
    `:feat-<branch>-<sha>` (consumed by `bsale-bi-staging`).
  - `make -f Makefile.bsale build-and-push-prod` →
    `:6.0.0-bsale.<N>` (consumed by `data-bi-platform`).

### Fixed

- **dockerfile**: install `zstd` in the builder stage. Required because the
  base image pulled from ECR is compressed with zstd, and decompression fails
  without the tool present.

[Unreleased]: https://github.com/aobispo-bsale/superset/compare/6.0.0-bsale.1...HEAD
[6.0.0-bsale.1]: https://github.com/aobispo-bsale/superset/releases/tag/6.0.0-bsale.1
