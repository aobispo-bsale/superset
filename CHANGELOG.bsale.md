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

## [6.0.0-bsale.4] - 2026-05-21

### Fixed

- **pie**: the donut center total ("Total: X") now recomputes dynamically to
  reflect only currently visible slices. Previously it was computed once at
  transform time and ignored both cross-filter exclusions (`isFiltered`) and
  legend toggles, leading to a static total that misled the viewer when slices
  were hidden. The fix wires `legendState` into `transformProps` (following the
  Gantt/Histogram pattern), guards `totalValue` accumulation with both signals
  (`!isFiltered && legendState[name] !== false`), applies the same guard to the
  "Other" bucket, and registers `legendselectchanged` / `legendselectall` /
  `legendinverseselect` handlers on the chart to push state changes back through
  `onLegendStateChanged`. Also forwards `legendState` to `getLegendProps` so
  `echartOptions.legend.selected` mirrors React state — without this, the base
  `setOption(_, notMerge=true)` re-render wipes ECharts' internal legend state
  on every toggle and a single click was silently undone (users had to click
  twice to hide a slice). Center total now stays consistent with what's
  rendered, on the first click.

## [6.0.0-bsale.3] - 2026-05-11

### Added

- **treemap**: new `Hierarchical color` opt-in control in the "Chart Options"
  panel. When enabled (default OFF — opt-in for backward compatibility), only
  top-level groupby nodes receive a colour from the categorical scheme, and
  deeper nodes inherit their parent's hue. ECharts then varies saturation per
  item using a wider range (`[0.3, 0.9]`) so all segments of the same parent
  visually group together (e.g. every segment under "ALIMENTOS Y BEBIDAS"
  shares the base orange, with larger segments saturated and smaller ones
  pale). Especially useful with 2+ groupby levels — single-level groupby keeps
  the original behaviour.

## [6.0.0-bsale.2] - 2026-05-11

### Added

- **treemap**: hovering a node now shows the percentage relative to the
  **global total** (root of the tree) alongside the existing percentage
  relative to the **parent group**. The tooltip stays compact: the original
  row is unchanged (`metric / value / parent percent`) and a new row labelled
  `% del total` is appended below, aligned in the same column as the parent
  percent. Useful for comparing nested segments across all top-level groups
  (e.g. comparing a segment's weight against the whole dataset rather than
  only against its industry). Validated visually in `bi-staging.bsale.io`
  against the Peruvian active-companies dataset (18 industries, 102
  segments, 1.585 companies).

### Changed

- **build**: `Makefile.bsale build-and-push-staging` now auto-writes
  `staging.auto.tfvars` to the sibling `bsale-bi-staging/terraform/`
  repository after pushing the image (path overridable via the
  `TFVARS_PATH` variable). The companion change in `bsale-bi-staging`
  converted the hardcoded `frontend_tag` in `ec2.tf` to a
  `frontend_assets_tag` Terraform variable, so the staging deploy now
  collapses from "edit source + apply" to:

      make -f Makefile.bsale build-and-push-staging
      cd ../bsale-bi-staging/terraform && terraform apply

  Tags remain immutable (`:feat-<branch>-<sha>`) — trazability is
  preserved, only the manual copy-paste step is automated away.

### Fixed

- **sankey**: `nodeOrder` now pins the rendered node sequence. The previous
  implementation relied on ECharts' `nodeSort` callback, which only ordered
  nodes logically — ECharts' iterative layout subsequently re-arranged them
  visually. The fix pre-sorts `seriesData` JS-side and sets
  `layoutIterations: 0`, forcing the renderer to honour the requested order.
  Tests now assert the rendered data order and the `layoutIterations` flag
  (instead of probing the dropped sort callback).

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

[Unreleased]: https://github.com/aobispo-bsale/superset/compare/6.0.0-bsale.3...HEAD
[6.0.0-bsale.3]: https://github.com/aobispo-bsale/superset/releases/tag/6.0.0-bsale.3
[6.0.0-bsale.2]: https://github.com/aobispo-bsale/superset/releases/tag/6.0.0-bsale.2
[6.0.0-bsale.1]: https://github.com/aobispo-bsale/superset/releases/tag/6.0.0-bsale.1
