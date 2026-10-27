# Development conventions

- Server code is in `src/`; the React management panel is in `client/`.
- GitHub installations consume tracked `lib/` files without building. After changing `src/`, `client/`, or locale data, run `npm run build` and include the resulting `lib/` changes in the same commit.
- Before delivery run `npm run typecheck`, `npm test`, and `npm run build`. CI checks that rebuilding leaves `lib/` unchanged, including added or removed files.
- Preserve fail-closed authorization: host operations need a consumed voucher; deny rules apply to every phase of a change. Management and sync endpoints remain owner-only and must never become model tools.
- Never log credentials, webhook URLs, sync passphrases, private keys, or provider response bodies. Use fake transports and temporary directories in tests.
- UI copy belongs in matching `locale/en.json` and `locale/zh.json` dictionaries. Use the DSH locale service for language changes.
- Record user-visible changes under Unreleased in `CHANGELOG.md`. Release steps: set matching package/lockfile versions, move Unreleased entries to the version/date, run checks and build, commit sources plus `lib/`, then tag the version. Publish only when requested.
- Local package archives belong in ignored `artifacts/packages/`, not the repository root.
