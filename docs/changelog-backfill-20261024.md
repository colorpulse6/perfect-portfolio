# Changelog backfill, 24 October 2026

Approved scope: fill the gaps with separate dated milestones. Preserve the existing entries and avoid presenting the work as one release.

The 16 new entries span 11 September through 24 October. Dates use the UTC day from GitHub release evidence. A successful deployment confirms that source shipped; it does not replace hands-on acceptance of every feature.

| Date | Entry | Source |
| --- | --- | --- |
| 11 Sep | Faster Saving and Application Tracking | [Job Toast #119](https://github.com/colorpulse6/jt3/pull/119), successful deployment 6398031754 |
| 22 Sep | Work With Me | [Portfolio #21](https://github.com/colorpulse6/perfect-portfolio/pull/21), approved deployed services page |
| 23 Sep | Connect Your Assistant | [Job Toast #126](https://github.com/colorpulse6/jt3/pull/126), successful deployment 6608693253 |
| 28 Sep | Claude Joins the Search | [Job Toast #132](https://github.com/colorpulse6/jt3/pull/132), successful deployment 6701784148 |
| 28 Sep | Practice Interviews You Can Resume | [Job Toast #144](https://github.com/colorpulse6/jt3/pull/144), successful deployment 6712944793 |
| 30 Sep | Events and Reminders | [Job Toast #152](https://github.com/colorpulse6/jt3/pull/152), successful deployment 6755151044 |
| 6 Oct | Take Your Data With You | [Job Toast #165](https://github.com/colorpulse6/jt3/pull/165), shipped after [build fix #167](https://github.com/colorpulse6/jt3/pull/167), successful deployment 6882732335 |
| 13 Oct | What Should I Do Next? | [Job Toast #171](https://github.com/colorpulse6/jt3/pull/171), successful deployment 7030983397 |
| 15 Oct | A Clearer Job Board | [Job Toast #179](https://github.com/colorpulse6/jt3/pull/179), successful deployment 7081786874 |
| 17 Oct | An Explorable Colony Map | [Sector Zero #24](https://github.com/colorpulse6/sector-zero/pull/24), [successful Pages deployment](https://github.com/colorpulse6/sector-zero/actions/runs/39010957547) |
| 18 Oct | Settlements and Ground Missions | [Sector Zero #25](https://github.com/colorpulse6/sector-zero/pull/25), [successful Pages deployment](https://github.com/colorpulse6/sector-zero/actions/runs/39163042227) |
| 20 Oct | More Complete Saved Postings | [Job Toast #184](https://github.com/colorpulse6/jt3/pull/184), successful deployment 7203102821 |
| 22 Oct | Salvage and Fighter Polish | [Sector Zero #26](https://github.com/colorpulse6/sector-zero/pull/26), [successful Pages deployment](https://github.com/colorpulse6/sector-zero/actions/runs/39730235392) |
| 22 Oct | A New Public Record | [Chimera site rewrite](https://github.com/colorpulse6/project-chimera/commit/a18e329b16c9c0f34abedac2354c084b3b35d5e5), [gameplay recording deployment](https://github.com/colorpulse6/project-chimera/actions/runs/39759591151), [haunt deployment](https://github.com/colorpulse6/project-chimera/actions/runs/39783997833) |
| 24 Oct | The Town Reaches the Sea | [Chimera town record](https://github.com/colorpulse6/project-chimera/commit/feea6b5dc920192db4439aabf1eaf9665ac6ea10), [successful Pages deployment](https://github.com/colorpulse6/project-chimera/actions/runs/40087643329) |
| 24 Oct | Scroll Through the Work | [Portfolio #23](https://github.com/colorpulse6/perfect-portfolio/pull/23), production Netlify deploy 6adccac28678760ac5fd742f, published 15:13:20 UTC |

## Evidence boundaries

- The data export merged on 4 October, but that deployment failed. The entry uses 6 October, when the follow-up build shipped successfully.
- The first ChatGPT connection was an initial implementation. Its consent defects were fixed later. That entry has no Live badge and describes the follow-up work.
- The 11 September deployment verifies the web/backend release. The extension changes were merged in the same milestone; the Chrome store rollout date was not established.
- Chimera entries describe its published development record. The game remains in progress. They do not announce a downloadable or browser demo, or claim later private build acceptance.
- Cerebro local features, design-only proposals, minor maintenance and upstream fork changes were excluded.

## Local validation

The existing latest-six changelog test was updated first and failed against the old content. It passes with the new entries.

- Type check passed.
- Lint passed with 0 errors and 18 existing warnings.
- All 156 tests passed, including the homepage's latest-six ordering.
- Production build passed. Gatsby emitted local image-library and stale browser-data warnings, but completed image processing and page generation successfully.
- All 16 titles were found in the generated changelog HTML. New entries contain no em dashes, and the diff whitespace check passed.
- No fresh visual browser acceptance was performed for this content-only backfill.

Logs are retained in `/private/tmp/changelog-backfill-checks/`. The isolated worktree is `/private/tmp/portfolio-changelog-20261024`, on `content/changelog-backfill-20261024`. It is retained for review. No preview server was started for this backfill.

Nic approved publication on 24 October 2026 after reviewing the backfill and validation results. The publication PR and production checks record the release outcome.
