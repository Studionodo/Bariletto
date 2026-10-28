# Ninna

Predicts naps and bedtime, and explains why.

[Leggi questo in italiano](README.md)

## What it is

Ninna is a web app (PWA) for parents of newborns and young children who want to understand their child's sleep rhythms instead of guessing them. It predicts when the next nap or bedtime will come, and always shows the reasoning behind it: no black-box predictions. It works entirely offline after the first load, has no servers of its own, and no account: all data stays on the phone of whoever uses it.

## What it does

**Predicting sleep**

- **Predicts the next sleep** based on the typical wake window for the child's age, refined day by day with the real rhythms observed.
- **Tells naps and bedtime apart on its own**, based on the naps already taken, the time of day and how close it is to the evening routine, so the parent doesn't have to guess.
- **Explains every prediction**: a dedicated button shows the full calculation, not just the result.
- **Flags transitions**: when a child seems to be dropping a nap, it reports it as information, never as an instruction.

**Logging**

- **Daily activities**: naps, night sleep, nursing, bottle, solids, diapers, pumping, night wakings.
- **Day timeline**: a bar from 00 to 24 with sleep blocks and feeds, to see how the day went without reading a list.
- **Time correction**: every logged entry can be edited afterwards, if you noted it late.
- **Health**: vitamins and medicines with the name of what was given, because "medicine" alone says nothing if a child takes more than one.
- **Growth**: weight, height and head circumference over time, with a weight trend. No growth curves and no percentiles: only your child's own data, never compared against a reference population.

**Supporting**

- **Sounds for sleep**: seven sounds generated in real time (white, pink, brown, waves, rain, heartbeat, shhh), with a shut-off timer and a compact player reachable from any screen.
- **Night mode**: a black screen with a single large button, made for feeding or handling a waking without turning on the light.
- **Notifications**: alerts when the next sleep or the evening routine is approaching.
- **Quick shortcuts**: long-pressing the app icon brings up "Start nap" and "Start night sleep".
- **A 13-article guide** on wake windows, sleepy cues, safe sleep, regressions and using the app, written in an informative tone, never a prescriptive one.

**Sharing and adapting**

- **Summary for the paediatrician**: a table of the last 14 days with averages, supplements and growth measurements, ready to print or save as PDF.
- **Backup and export**: JSON for a full backup or to hand the data to another parent, CSV for personal analysis.
- **Statistics without judgement**: the last 7 days of sleep and today's numbers shown alongside typical ranges for the age, with no merit labels and no targets to hit.
- **Log-only mode**: hides predictions, comparisons and statistics when looking at the numbers stops helping.
- **Appearance and language**: light, dark or automatic theme following the system; Italian and English, switchable instantly.

## How it handles data

No data about your child ever leaves the device: no sign-up, no cloud, no sync. Everything stays in local storage, exportable whenever you want as JSON or CSV.

No third party receives requests from the app: typefaces, icons and code are all served by the app itself, not by external delivery networks. The only possible connections are to the hosting the app is downloaded and updated from, as with any website, and the Ko-fi link, which opens only if you choose to tap it.

The price of that choice is that there's no automatic data sharing between two parents yet: the only way today is exporting a file and passing it along manually.

## Ninna is not a medical device

It's an organisation tool. For any concern about a child's health or sleep, a paediatrician remains the reference.

---

A **Studionodo** project.
