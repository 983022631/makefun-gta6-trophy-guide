# Leonida Trophy Guide — GTA VI Platinum Tracker

An offline, open-source guide and tracker for the 55 PlayStation 5 trophies of
Grand Theft Auto VI. Static files only: open `app/index.html` in a browser and
it works with the network off.

## What it does

- **Tracker** — every trophy with its official name, description and grade,
  a checklist saved in the browser (localStorage), export to a JSON file and
  import back, filters by kind and grade, search, and a spoiler setting that
  hides story trophies until they are earned.
- **Roadmap to Platinum** — four stages in order: story, strangers & side
  work, collectibles & exploration, then the activity grind and 100%.
- **Missables** — an 11-trophy watch-list, flagged only where the official
  description names one specific story mission, place or choice.
- **Guides** — a guide for every trophy in our own words, each with its
  sources named beside it.

## Sources (verified 2026-11-20)

The official list — all 55 names, descriptions and grades — was verified
against two public trackers, which agree on every name, description and
grade:

- Exophase — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi

PSNProfiles also gives the PSN progress target where one exists (for example
0/42 Shooting Range challenges); those targets are shown beside the trophy.
Make-up: 1 platinum, 2 gold, 6 silver, 46 bronze.

Guides are original writing for this entry, built only from the official
descriptions plus the PSN targets. Where an official description does not pin
down a trigger, the guide says so instead of inventing a step. No Rockstar
logo, artwork or game screenshot is used anywhere.

## Run it

```sh
node serve.ts   # serves app/ at http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## License

MIT — see `LICENSE`.
