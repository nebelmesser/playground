# arXiv visualization work

These instructions apply to this directory and its subdirectories.

- Before researching, proposing or implementing another visualization, read `history/tried-visualizations.md`.
- Check the underlying mechanism and paper, not just the title. Do not propose a cosmetic variant of an already tried model as a new direction.
- Models marked removed were explicitly removed by the user. Revisit one only when the user requests it.
- After trying a new model, add its mechanism, source, date and actual outcome to the history, even if its implementation is later removed. Do not invent a reason for rejection.
- Keep the interface in English. Use descriptive folder names and URLs without numeric prefixes; do not add ordinal badges or numbered model lists.
- Use the parent `./scripts/preview` workflow. Rebuild static entry pages with `node arxiv/build-pages.mjs` after changing the catalog; browser modules are served directly.
