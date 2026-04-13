# MyChamber Prerequisites

Use this checklist before running the latest MyChamber backend and frontend.

## Required

- Node.js `18+` (recommended: latest LTS)
- npm `9+`
- MySQL Server `8+`

## Optional but Recommended

- Git (for clone/pull workflow)
- VS Code
- API client such as Postman or Thunder Client

## Why Node 18+

The frontend uses Vite 5, which requires newer Node versions. Using Node 18+ avoids build and dev server compatibility issues.

## Quick Verification Commands

Run these in PowerShell (or your terminal):

- Node.js version: `node -v`
- npm version: `npm -v`
- MySQL client version: `mysql --version`
- Git version (optional): `git --version`

## Expected Version Examples

- Node.js: `v18.x`, `v20.x`, or newer
- npm: `9.x`, `10.x`, or newer
- MySQL: `8.x`

## MySQL Setup Notes

- Ensure MySQL server is running before starting backend.
- Ensure your `.env` database values are correct:
	- `DB_HOST`
	- `DB_USER`
	- `DB_PASSWORD`
	- `DB_NAME`
	- `DB_PORT`

## Next Step

After prerequisites are ready, continue with setup steps in `README.md`.
