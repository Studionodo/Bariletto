# Bariletto

Counts the hours you're not looking. Which watch to wear today, and what it needs.

*[Leggi questo in italiano](README.md)*

## What it is

Bariletto is a web app (PWA) for anyone with more than one mechanical or automatic watch who wants to know, every day, what each one needs: winding, light exposure, chronograph reset, service. Open the app and you get the whole collection as a list, each watch's state up front, and the one that needs you most at the top. It runs entirely offline, has no server, and no account: all data stays on the device it's used on.

## What it does

- Shows the whole collection's state each day as a list, ordered by need: what's stopped or run down at the top, what's fine at the bottom. State comes before the name, because the question is who to look after, not which watch is which.
- Logs common actions with one tap: wore it, wound it, exposed it to light, reset the chronograph.
- Keeps an archive of over 150 mechanical and quartz calibers, each with its own specific rules (power reserve, time windows to avoid touching the crown, escapement type).
- Flags when an automatic watch is at risk of stopping, or when a quartz watch is approaching its expected battery end.
- Calculates an indicative next service date, if you enter purchase and last service dates.
- Optional system notifications (Android/Chrome only) so a stopped watch doesn't go unnoticed too long.
- Full chronological log of every action taken on every watch.

## How it works

Bariletto doesn't measure winding minute by minute: it logs a single data point per action, the timestamp of the last tap, and from there calculates what's needed based on that specific watch's caliber. It's an estimate built on manufacturer-declared specifications, not a direct measurement of actual power reserve.

## Technology

Plain JavaScript, no framework. Data stored locally in the browser (IndexedDB). No external libraries, no calls to any server of ours.

## Usage

Open the app in a browser at `bariletto.vercel.app`, or install it as an app from the browser menu to use it offline from the home screen.

## License

See [LICENSE](LICENSE).
