# Contributing

Thanks for helping improve the Saudi National Address Open Dataset.

## Propose a data fix

The canonical data lives in [`data/source/`](data/source/) and everything in
[`data/dist/`](data/dist/) is generated from it. To correct a name, a boundary, or a
missing record:

1. Edit the relevant file in `data/source/` (`regions.json`, `cities.json`, or
   `districts.json`). Keep the upstream shape, including the `[lat, lon]` coordinate order
   and the 11-digit `district_id`.
2. Regenerate the outputs:
   ```sh
   pnpm install
   pnpm run build
   ```
3. Run the checks:
   ```sh
   pnpm run validate
   pnpm test
   ```
4. Commit both `data/source/` and the regenerated `data/dist/` (and `packages/*/data/`),
   then open a pull request. Please cite a source for the change (Google Maps, the SPL
   website, a government publication, etc.).

Never hand-edit files in `data/dist/` — they are overwritten on every build, and CI
rejects a `data/dist/` that does not match a fresh build.

## Add a new output format

1. Add a module under `scripts/lib/<format>.ts` that takes the in-memory records and
   returns the serialized output.
2. Wire it into `scripts/build.ts` so it writes into `data/dist/` (and, if it is a
   JSON-family file consumed by a package, into the package `data/` copy step).
3. Document the new file in the **Data formats available** table in `README.md`.
4. Run `pnpm run build && pnpm run validate && pnpm test`.

## Why `data/dist/` is committed

Committing the generated outputs lets people download a single file without cloning and
building. To keep them trustworthy, the `check:dist-clean` CI step runs `pnpm run build`
and fails if the committed `data/dist/` (or `packages/*/data/`) differs from the freshly
generated output. So always rebuild and commit the regenerated files together with any
source change.

## Code style

- TypeScript and JSON are formatted and linted with [Biome](https://biomejs.dev/):
  `pnpm run format` and `pnpm run lint`.
- Every code source file carries an `SPDX-License-Identifier: MIT` header.
