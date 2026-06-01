# Map viewer

A single static page that browses the dataset with [Leaflet](https://leafletjs.com/)
(loaded from a CDN — there is no build step).

## What it does

- Renders the 13 regions; the sidebar lists them.
- Click a region to zoom in and load its districts.
- Click a district to see its `name_ar` / `name_en` / `district_id` / `local_seq` /
  `city_id`, with a **Copy district_id** button.
- A breadcrumb (`Saudi Arabia / Region / District`) navigates back up.
- An Arabic / English label toggle (top right).
- A **Decode a district_id** widget that splits an 11-digit id into
  `region_id` / `city_id` / `local_seq` live.
- A **Download data** dropdown linking every file in `data/dist/`.

## Running locally

The page fetches the GeoJSON from `data/dist/`. Serve the repository root so
those files are reachable:

```sh
pnpm dlx serve .
```

then open `http://localhost:3000/viewer/`.

## Deployment

`.github/workflows/pages.yml` assembles the GitHub Pages site: it copies
`viewer/` to the site root and includes `data/dist/` and `schemas/`, so the
relative `data/dist/` paths resolve at `https://yasseralsamman.github.io/saudi-national-address/`.
