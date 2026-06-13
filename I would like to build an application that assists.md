<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I would like to build an application that assists in keeping baseball players stats. It would be an application that parents can use to keep stats of all the kids on the team. It should be a mobile first app and be capable of being run on a phone or ipad. The app would take into account all baseball stats and be intuitively setup for parents who keep stats. The app will ultimately feed an end of the year rollup and provide stats for each player. I think the app will also assist in providing player stats throughout the year. The app would probably be html based, but I'm open to other suggestions. The parents will use the app to enter the stats during the game so it needs to be able to be used to quickly enter, edit, delete and add stats. It should also automatically save after stats are entered. Ideally, it will track trends over the season.

Yes — this is a very feasible app, and for your use case I would build it as a mobile-first web application with an offline-capable local data layer, then optionally add cloud sync later for team-wide sharing and season rollups. Your stated preference for HTML-based, local-first tools lines up well with that approach, especially because in-game score entry needs speed, resilience, and simple deployment on phones and iPads.

## Product shape

The core job is not “show baseball stats,” but “let a parent record the current play in 2–4 taps without losing the game flow.” Existing tools in this space emphasize live scorekeeping, game-by-game stats, season stats, and trend views, which validates the feature direction you described.[^1_1][^1_2][^1_3]

I would define the app around four modes:

- Game setup: roster, lineup, positions, opponent, game date.[^1_4][^1_5]
- Live scoring: fast plate-appearance and baserunner entry during the game.[^1_6][^1_7][^1_8]
- Post-game correction: edit, delete, and reconcile missed plays.[^1_8][^1_9]
- Season dashboard: player totals, rate stats, splits, and trend lines over time.[^1_10][^1_2]


## Recommended stack

Best fit: a Progressive Web App using HTML, CSS, and TypeScript with a component framework such as React or Preact, tuned for tablet and phone layouts. A PWA can run full-screen on iPhone or iPad, support offline use, and feel app-like without forcing App Store distribution on day one.

For storage, I would not keep data inside the HTML file itself; I would use a real local data layer from the start. Based on your prior architecture preferences, the most practical path is:

- MVP: PWA + IndexedDB or local SQLite via a wrapper if you package later.[^1_11]
- Growth path: Tauri mobile/desktop or a thin API backend with SQLite/Postgres sync for multi-parent collaboration and admin reporting.[^1_11]


## UX model

Parents keeping stats are often not trained scorekeepers, so the UI should be event-driven rather than scorebook-driven. Little League guidance and youth scorekeeping references show that scorekeepers mainly need lineups, common play outcomes, runner advancement, inning progression, and end-of-game tallying, not a complicated expert-only notation system on every screen.[^1_5][^1_8]

A good mobile-first entry flow would look like this:

1. Select batter.
2. Tap result: single, double, triple, HR, walk, strikeout, HBP, reach on error, fielder’s choice, out type.[^1_12][^1_5]
3. Adjust runner advancement with one-tap base controls.
4. Auto-save immediately and update player/game/team totals.
5. Offer undo and quick edit for the last play, because mistakes are inevitable during live entry.[^1_9][^1_8]

## Data and stats

You should store every game event as the source of truth, then derive box scores, player summaries, and trend analytics from those events. That model is more durable than directly editing aggregate stats, and it supports corrections, deletions, audit history, and season rollups cleanly.[^1_11]

At minimum, the derived stats layer should include:

- Batting: PA, AB, H, 1B, 2B, 3B, HR, RBI, R, BB, HBP, SO, SB, CS, AVG, OBP, SLG, OPS.[^1_2][^1_5]
- Pitching: IP, BF, H, R, ER, BB, SO, HBP, WP, BK, pitch count, ERA, WHIP, K/BB.[^1_2][^1_5]
- Fielding: PO, A, E, DP involvement, fielding percentage.[^1_2]
- Trends: last 3 games, last 5 games, rolling batting average, on-base trend, pitching workload trend, streaks.[^1_10][^1_2]

A useful example is a parent opening the app in the third inning, tapping “2B to RF,” then tapping two baserunner advances and one run scored; the app should instantly update that batter’s game line, season totals, team score, and trend tiles with no extra save step.[^1_5][^1_8][^1_10]

## MVP scope

For a first version, I would keep the MVP tight and optimize for speed and trust. Existing scorekeeping apps highlight quick roster setup, live score entry, stat tracking, and post-game review as the essential baseline, which matches the smallest sensible release for your app.[^1_7][^1_6][^1_2]

Here is a practical MVP cut:


| Area | MVP features |
| :-- | :-- |
| Team setup | Team, season, roster, jersey number, player positions, batting order.[^1_4][^1_5] |
| Live game | Inning, outs, batter, result buttons, runner movement, auto-save, undo last play.[^1_6][^1_8] |
| Editing | Edit or delete any recorded play; recompute stats automatically.[^1_9] |
| Stats | Per-game and season player stats, team totals, simple trends.[^1_10][^1_2] |
| Reports | End-of-season player summary and export to CSV/PDF later. |

V2 can add multi-user sync, pitch-by-pitch entry, spray charts, lineup substitutions, role-based permissions, and parent-facing live views. GameChanger specifically promotes advanced stats, filters, and player insight features, which is a good signal for the direction of your later roadmap.[^1_3][^1_10][^1_2]

Would you like me to turn this into a concrete MVP architecture next, with screens, data schema, and a recommended database design?
<span style="display:none">[^1_13][^1_14][^1_15][^1_16]</span>

<div align="center">⁂</div>

[^1_1]: https://gc.com/baseball

[^1_2]: https://help.gc.com/hc/en-us/articles/360039839812-Scorekeeping-and-Stats

[^1_3]: https://www.littleleague.org/help-center/gamechanger-little-league-specific-faqs/

[^1_4]: https://www.newwestbaseball.ca/scoreboard-scorekeeping/

[^1_5]: https://www.littleleague.org/university/articles/scorekeeping-101/

[^1_6]: https://play.google.com/store/apps/details?id=com.fasterthanmonkeys.iscore\&hl=en_US

[^1_7]: https://iscoresports.com/baseball/

[^1_8]: https://www.ntlittleleague.com/Default.aspx?tabid=1383410

[^1_9]: https://gc.com/post/game-stats-and-stat-editing-available-on-web

[^1_10]: https://apps.apple.com/us/app/gamechanger/id1308415878

[^1_11]: https://www.perplexity.ai/search/c5e8e98f-f951-42b8-99a7-237d1b2a7bad

[^1_12]: https://spiderselite.com/2019/10/11/youth-baseball-scorekeepers-guide/

[^1_13]: https://chalkandclay.com/baseball-scorekeeping-apps/

[^1_14]: https://apps.apple.com/us/app/iscore-baseball-and-softball/id364364675

[^1_15]: https://www.reddit.com/r/BaseballScorecards/comments/1df0192/scorekeeping_apps/

[^1_16]: https://www.reddit.com/r/BaseballScorecards/comments/1dmrc4w/baseball_101_advice_for_a_rookie_scorekeeper/


---

# yes, this into a concrete MVP architecture next, with screens, data schema, and a recommended database design

Yes — here is a concrete MVP architecture for the baseball stats app, optimized for fast in-game use by parents, mobile-first screens, and a local-first data model that can later grow into multi-user sync. Because your goal is fast entry during games plus season rollups and trends, the cleanest design is an event-sourced app: record each play once, then derive game stats, season stats, and trends from that event stream.[^2_1][^2_2]

## Architecture

I would recommend a local-first web app built as a Progressive Web App using TypeScript plus React or Preact, with a thin service layer and a local database. That matches your preference for HTML-based tools while avoiding the long-term problems of storing operational data directly in HTML.[^2_3][^2_4][^2_5][^2_6][^2_7]

The MVP stack should be:

- Front end: Preact + TypeScript + Vite, mobile-first responsive UI for phone and iPad.[^2_3]
- State: local UI state plus an action queue for optimistic saves.
- Storage: SQLite if packaged later, or IndexedDB for browser-first MVP; SQLite becomes the better long-term source of truth once you want export, sync, stronger querying, or more data durability.[^2_8][^2_4][^2_6][^2_7]
- Packaging path: start as a PWA, then move to Tauri if you want a more installable offline app with bundled SQLite.[^2_6][^2_7]

A practical module layout would be:

1. UI layer: screens, forms, score entry controls, dashboards.
2. Domain layer: baseball rules, stat derivation, inning state, validation.[^2_1][^2_9]
3. Data layer: repositories for teams, players, games, events, derived snapshots.[^2_4][^2_6]
4. Sync/export layer: CSV export first, optional cloud sync later.[^2_4]

## Screens

The MVP should have six primary screens, each centered on one user job during the season. Youth scorekeeping guidance emphasizes lineup setup, tracking outs/runs/at-bats, correcting mistakes, and balancing the final box score, so the app should expose those tasks directly rather than burying them in menus.[^2_1][^2_10][^2_11]

### 1. Team home

This is the landing screen for one team and season. It shows next game, roster count, recent player trends, latest game summary, and one big “Start Game” action because that is the most time-critical task during the season.[^2_12]

### 2. Roster and lineup

This screen manages players, jersey numbers, batting order, default positions, and active/inactive status. Scorekeeping references consistently start with entering the lineup and jersey numbers, so this should be a first-class screen rather than a setup afterthought.[^2_1][^2_11]

### 3. Live game scorer

This is the core screen and should support one-handed or quick-thumb use on a phone. It should show inning, outs, current batter, base runners, pitch count optionally, score, and a grid of common play-result buttons like 1B, 2B, 3B, HR, BB, HBP, K, FC, E, and common outs.[^2_1][^2_9]

On this screen, the fastest interaction model is:

- Choose result.
- Confirm runner advancement if not obvious.
- Auto-save immediately.
- Show an undo toast for the last play.
- Keep edit history accessible but not intrusive.[^2_13][^2_14]


### 4. Play log

This is the correction screen for parents who need to edit mistakes after the inning or game. Since real scorekeeping often involves fixing errors and reconciling ambiguous plays, this screen should support edit, delete, replay, and recompute of all downstream stats automatically.[^2_10][^2_13][^2_14]

### 5. Game summary

This screen shows box score, batting lines, pitching line, fielding summary, and scoring recap after the game. It should also flag incomplete or inconsistent bookkeeping, such as an inning total mismatch, since scorekeeping sources stress end-of-inning and end-of-game balancing.[^2_1][^2_9]

### 6. Season dashboard

This is where the app becomes useful all year, not just during games. It should show player cards, season totals, rate stats, rolling trends, recent form, and simple filters such as last 3 games, last 5 games, home/away, or by position group.[^2_15][^2_2]

## Data model

The most important design decision is to store atomic game events rather than only aggregate stats. That gives you editability, traceability, post-game corrections, and the ability to add new derived metrics later without changing how data is captured.[^2_4][^2_6][^2_1]

The core entities should be:


| Entity | Purpose |
| :-- | :-- |
| Team | One team being tracked for a season. |
| Season | Year, division, organization, ruleset, stat configuration. |
| Player | Child on the roster, jersey, handedness optional, primary positions.[^2_1][^2_11] |
| Game | One scheduled or completed game with opponent, location, date, status.[^2_12] |
| LineupSlot | The game-specific batting order and defensive setup.[^2_1] |
| PlateAppearance | One batter outcome in a game, linked to inning and pitcher if tracked.[^2_1][^2_9] |
| PlayEvent | Detailed event records for hits, outs, steals, errors, runs, substitutions, etc.[^2_1] |
| PitchEvent | Optional pitch-level detail for later expansion; not required for MVP.[^2_1][^2_11] |
| PlayerGameStat | Cached derived game-level stats per player for fast reads.[^2_2] |
| PlayerSeasonStat | Cached season aggregates for dashboards and trends.[^2_2][^2_15] |
| TrendSnapshot | Precomputed rolling metrics for charts and player summaries. |

A clean relationship pattern is:

- Team has many players, games, and seasons.
- Game belongs to one team and one season.
- Game has many lineup slots and many play events.[^2_1]
- Play events reference batter, pitcher optional, fielders optional, and affected runners.[^2_1]
- Derived stats are rebuildable from play events at any time.[^2_6][^2_4]


## Recommended database

For the long-term MVP, I recommend SQLite as the canonical database design even if the first browser-only prototype uses IndexedDB. Your past architecture exploration already points toward HTML as UI and SQLite as the durable operational store, which is the right mental model here.[^2_4][^2_6][^2_7]

A recommended SQLite schema would look like this conceptually:

### teams

- id
- name
- league_name
- age_group
- created_at
- updated_at


### seasons

- id
- team_id
- season_year
- season_name
- ruleset_json
- created_at


### players

- id
- team_id
- first_name
- last_name
- jersey_number
- bats
- throws
- active
- created_at
- updated_at


### games

- id
- team_id
- season_id
- opponent_name
- game_date
- home_away
- location
- status
- final_home_score
- final_away_score
- created_at
- updated_at


### lineup_slots

- id
- game_id
- player_id
- batting_order
- defensive_position
- starter_flag


### play_events

- id
- game_id
- sequence_no
- inning_no
- half_inning
- outs_before
- batter_player_id
- pitcher_player_id nullable
- event_type
- event_subtype
- result_json
- runs_scored
- rbi
- is_edit_of_event_id nullable
- created_at
- deleted_at nullable


### baserunner_movements

- id
- play_event_id
- player_id
- start_base
- end_base
- scored_flag
- out_flag


### defensive_participation

- id
- play_event_id
- player_id
- role_code
- field_position


### player_game_stats

- id
- game_id
- player_id
- batting_json
- pitching_json
- fielding_json
- updated_at


### player_season_stats

- id
- season_id
- player_id
- batting_json
- pitching_json
- fielding_json
- updated_at


### trend_snapshots

- id
- season_id
- player_id
- snapshot_date
- metric_code
- window_type
- metric_value

The reason I would allow some JSON fields in the MVP is speed of development without over-normalizing edge cases too early. Baseball scoring can become surprisingly irregular once you add youth-rule variants, substitutions, courtesy runners, or league-specific pitch-count rules, so a hybrid relational-plus-JSON model gives you structure where you need it and flexibility where rules vary.[^2_6][^2_1][^2_11]

## Stat engine

The stat engine should be deterministic and rebuildable. Youth scorekeeping sources focus on practical outcomes such as hits, outs, walks, runs, RBIs, errors, pitch counts, and inning totals, so the MVP should calculate those reliably before you add advanced analytics.[^2_1][^2_9][^2_11]

For MVP, derive these stat groups:

### Batting

- G, PA, AB, H, 1B, 2B, 3B, HR, R, RBI, BB, HBP, SO, SB, CS, AVG, OBP, SLG, OPS.[^2_15][^2_1][^2_2]


### Pitching

- G, IP, BF, H, R, ER, BB, HBP, SO, pitch count, ERA, WHIP.[^2_1][^2_11][^2_2]


### Fielding

- Chances, PO, A, E, DP involvement, fielding percentage.[^2_2]


### Team and trend

- Runs per game, hits per game, team OBP, player last-3-game AVG, rolling OBP, rolling strikeout rate, pitching workload by week.[^2_2]

The engine should follow this processing flow:

1. Save play event.
2. Recompute current game state from the changed event forward.
3. Rebuild affected player-game stats.
4. Update player-season aggregates.
5. Update trend snapshots for impacted players.
6. Refresh UI immediately from local cache.[^2_4][^2_6]

## Recommended technical design

I would structure the app in feature modules instead of by file type because this domain has clear boundaries. That usually keeps baseball rule logic cleaner and easier to test than spreading it across generic folders.[^2_3]

A good code structure would be:

- `features/team`
- `features/roster`
- `features/game-setup`
- `features/live-scoring`
- `features/play-log`
- `features/stats`
- `features/trends`
- `data/repositories`
- `domain/baseball-rules`
- `domain/stat-engine`
- `domain/game-state`
- `shared/ui`

The key domain services should be:

- `GameStateService`: current inning, outs, bases, batter rotation.
- `PlayRecorderService`: validates and writes a play.
- `StatRebuilderService`: recomputes game and season stats.
- `TrendService`: calculates rolling metrics.
- `ExportService`: CSV and printable season report.[^2_4]


## MVP build order

The safest build order is to prove live scoring first, then add season intelligence. Scorekeeping references make clear that getting the basic recording flow right matters more than starting with a huge analytics surface.[^2_1][^2_11][^2_13]

I would build in this sequence:

1. Team and roster management.[^2_1]
2. Game creation and lineup entry.[^2_11][^2_1]
3. Live scoring with auto-save and undo.[^2_14]
4. Play log editing and delete flow.[^2_14]
5. Derived game stats and game summary.[^2_9]
6. Season rollups and player cards.[^2_2]
7. Trend charts and export.[^2_15]

My strongest recommendation is this: treat the **play event ledger** as the heart of the app, and treat all stats, dashboards, and reports as derived outputs. That approach gives you the most robust foundation for editability, accuracy, trend analysis, and eventual sync without having to redesign the data model later.[^2_4][^2_6]

Would you like the next step to be a concrete SQL schema plus TypeScript interfaces, or a screen-by-screen wireframe and component specification?
<span style="display:none">[^2_16][^2_17][^2_18][^2_19][^2_20][^2_21][^2_22]</span>

<div align="center">⁂</div>

[^2_1]: https://www.littleleague.org/university/articles/scorekeeping-101/

[^2_2]: https://help.gc.com/hc/en-us/articles/360039839812-Scorekeeping-and-Stats

[^2_3]: https://www.perplexity.ai/search/ab41d7d1-6549-40a2-ac1e-48dcf879946d

[^2_4]: https://www.perplexity.ai/search/e9752619-73ba-4ddf-92bf-95c2babe91f0

[^2_5]: https://www.perplexity.ai/search/07c9729b-96ec-4336-af46-6c75601c6b2a

[^2_6]: https://www.perplexity.ai/search/c5e8e98f-f951-42b8-99a7-237d1b2a7bad

[^2_7]: https://www.perplexity.ai/search/4fff6e51-b851-4e37-9956-7ef35b368b7e

[^2_8]: https://www.perplexity.ai/search/1e3f7c24-8f0c-48e2-a423-2d48d5c9466b

[^2_9]: https://www.mlb.com/official-information/basics/score

[^2_10]: https://gc.com/gamechanger-university/scorekeeping-baseball-softball

[^2_11]: https://www.tomballlittleleague.com/LinkClick.aspx?fileticket=8rqAR9XcOT4%3D\&tabid=1455379\&portalid=3823

[^2_12]: https://gc.com/baseball

[^2_13]: https://www.reddit.com/r/BaseballScorecards/comments/1dmrc4w/baseball_101_advice_for_a_rookie_scorekeeper/

[^2_14]: https://gc.com/post/game-stats-and-stat-editing-available-on-web

[^2_15]: https://play.google.com/store/apps/details?id=com.gc.teammanager\&hl=en_US

[^2_16]: https://baseballsavant.mlb.com/league

[^2_17]: https://en.wikipedia.org/wiki/Baseball_statistics

[^2_18]: https://talksox.com/boston-red-sox-guides-resources/baseball-advanced-metrics-explained-with-definitions-r4/

[^2_19]: https://www.reddit.com/r/baseball/comments/1armia6/somewhat_out_of_the_loop_on_advanced_stats_in/

[^2_20]: https://d1baseball.com/statistics/

[^2_21]: https://www.espn.com/mlb/stats/team

[^2_22]: https://baseballsavant.mlb.com


---

# I would like the SQL schema and TypeScript interfaces first

Yes — for this app I would make SQLite the source of truth and define TypeScript interfaces directly around the database tables plus a few richer domain types for live game state and stat calculations. That fits your local-first preference, keeps the HTML/UI thin, and gives you a schema that can later support packaged offline use or sync to a larger backend without redesigning the whole model.[^3_1][^3_2]

## Schema approach

The schema should treat the recorded play stream as canonical data and treat summaries as rebuildable projections. That matches how scorekeeping works in practice, where inning-level and game-level reconciliation comes from the underlying play record, not from hand-edited totals.[^3_3][^3_4]

For SQLite specifically, foreign keys should be enforced explicitly and index usage should be deliberate rather than excessive, because referential integrity and targeted query performance matter more here than premature complexity.[^3_1][^3_5][^3_6][^3_7]

## SQL schema

Below is a concrete MVP SQLite schema designed for one team app that can still support multiple seasons and many games. It uses normalized core tables for integrity, plus projection tables for fast dashboards and season rollups.[^3_7][^3_1]

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  league_name TEXT,
  age_group TEXT,
  home_city TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE seasons (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  season_name TEXT NOT NULL,
  ruleset_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE (team_id, season_year, season_name)
);

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number TEXT,
  bats TEXT CHECK (bats IN ('R','L','S') OR bats IS NULL),
  throws_hand TEXT CHECK (throws_hand IN ('R','L') OR throws_hand IS NULL),
  primary_position TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  opponent_name TEXT NOT NULL,
  game_date TEXT NOT NULL,
  start_time TEXT,
  location TEXT,
  home_away TEXT NOT NULL CHECK (home_away IN ('HOME','AWAY','NEUTRAL')),
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED','IN_PROGRESS','FINAL','CANCELLED')),
  our_final_score INTEGER,
  opponent_final_score INTEGER,
  innings_scheduled INTEGER NOT NULL DEFAULT 6,
  current_inning INTEGER,
  current_half TEXT CHECK (current_half IN ('TOP','BOTTOM') OR current_half IS NULL),
  current_outs INTEGER CHECK (current_outs BETWEEN 0 AND 2 OR current_outs IS NULL),
  current_batting_slot INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE game_lineups (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  batting_order INTEGER NOT NULL CHECK (batting_order >= 1),
  starter_flag INTEGER NOT NULL DEFAULT 1 CHECK (starter_flag IN (0,1)),
  entered_in_inning INTEGER,
  exited_in_inning INTEGER,
  defensive_position TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT,
  UNIQUE (game_id, batting_order),
  UNIQUE (game_id, player_id, entered_in_inning)
);

CREATE TABLE play_events (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  inning_no INTEGER NOT NULL CHECK (inning_no >= 1),
  half_inning TEXT NOT NULL CHECK (half_inning IN ('TOP','BOTTOM')),
  outs_before INTEGER NOT NULL CHECK (outs_before BETWEEN 0 AND 2),
  batter_player_id TEXT NOT NULL,
  pitcher_player_id TEXT,
  event_type TEXT NOT NULL,
  event_code TEXT NOT NULL,
  description TEXT,
  balls INTEGER CHECK (balls BETWEEN 0 AND 4 OR balls IS NULL),
  strikes INTEGER CHECK (strikes BETWEEN 0 AND 3 OR strikes IS NULL),
  runs_scored INTEGER NOT NULL DEFAULT 0 CHECK (runs_scored >= 0),
  rbi INTEGER NOT NULL DEFAULT 0 CHECK (rbi >= 0),
  earned_run_flag INTEGER CHECK (earned_run_flag IN (0,1) OR earned_run_flag IS NULL),
  error_on_play_flag INTEGER NOT NULL DEFAULT 0 CHECK (error_on_play_flag IN (0,1)),
  result_json TEXT NOT NULL DEFAULT '{}',
  source_event_id TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (batter_player_id) REFERENCES players(id) ON DELETE RESTRICT,
  FOREIGN KEY (pitcher_player_id) REFERENCES players(id) ON DELETE RESTRICT,
  FOREIGN KEY (source_event_id) REFERENCES play_events(id) ON DELETE SET NULL,
  UNIQUE (game_id, sequence_no)
);

CREATE TABLE baserunner_movements (
  id TEXT PRIMARY KEY,
  play_event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  start_base TEXT CHECK (start_base IN ('BATTER','FIRST','SECOND','THIRD')),
  end_base TEXT CHECK (end_base IN ('FIRST','SECOND','THIRD','HOME','OUT')),
  advance_reason TEXT,
  out_on_play_flag INTEGER NOT NULL DEFAULT 0 CHECK (out_on_play_flag IN (0,1)),
  run_scored_flag INTEGER NOT NULL DEFAULT 0 CHECK (run_scored_flag IN (0,1)),
  rbi_credit_flag INTEGER NOT NULL DEFAULT 0 CHECK (rbi_credit_flag IN (0,1)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (play_event_id) REFERENCES play_events(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT
);

CREATE TABLE defensive_results (
  id TEXT PRIMARY KEY,
  play_event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  field_position TEXT,
  result_role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (play_event_id) REFERENCES play_events(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT
);

CREATE TABLE pitching_appearances (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  started_flag INTEGER NOT NULL DEFAULT 0 CHECK (started_flag IN (0,1)),
  sequence_no INTEGER NOT NULL,
  entered_inning INTEGER NOT NULL,
  exited_inning INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT,
  UNIQUE (game_id, sequence_no)
);

CREATE TABLE stat_lines_game (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  stat_group TEXT NOT NULL CHECK (stat_group IN ('BATTING','PITCHING','FIELDING','BASERUNNING')),
  stats_json TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE (game_id, player_id, stat_group)
);

CREATE TABLE stat_lines_season (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  stat_group TEXT NOT NULL CHECK (stat_group IN ('BATTING','PITCHING','FIELDING','BASERUNNING')),
  stats_json TEXT NOT NULL,
  calculated_at TEXT NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE (season_id, player_id, stat_group)
);

CREATE TABLE trend_snapshots (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('LAST_3','LAST_5','SEASON_TO_DATE','CUSTOM')),
  snapshot_date TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_seasons_team_id ON seasons(team_id);
CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_season_id ON games(season_id);
CREATE INDEX idx_games_game_date ON games(game_date);
CREATE INDEX idx_game_lineups_game_id ON game_lineups(game_id);
CREATE INDEX idx_game_lineups_player_id ON game_lineups(player_id);
CREATE INDEX idx_play_events_game_id ON play_events(game_id);
CREATE INDEX idx_play_events_game_sequence ON play_events(game_id, sequence_no);
CREATE INDEX idx_play_events_batter_player_id ON play_events(batter_player_id);
CREATE INDEX idx_baserunner_movements_play_event_id ON baserunner_movements(play_event_id);
CREATE INDEX idx_defensive_results_play_event_id ON defensive_results(play_event_id);
CREATE INDEX idx_pitching_appearances_game_id ON pitching_appearances(game_id);
CREATE INDEX idx_stat_lines_game_lookup ON stat_lines_game(game_id, player_id, stat_group);
CREATE INDEX idx_stat_lines_season_lookup ON stat_lines_season(season_id, player_id, stat_group);
CREATE INDEX idx_trend_snapshots_lookup ON trend_snapshots(season_id, player_id, metric_code, snapshot_date);
```


## TypeScript interfaces

I would split the TypeScript types into three layers: raw table-row interfaces, input command types for creating or editing records, and richer domain types for live game state. Using interfaces for plain data and reserving classes only for logic-heavy services keeps the model simple and idiomatic.[^3_2][^3_8]

### Table row interfaces

```ts
export type Id = string;
export type ISODate = string;
export type ISODateTime = string;

export type Handedness = "R" | "L" | "S";
export type HomeAway = "HOME" | "AWAY" | "NEUTRAL";
export type GameStatus = "SCHEDULED" | "IN_PROGRESS" | "FINAL" | "CANCELLED";
export type HalfInning = "TOP" | "BOTTOM";
export type StatGroup = "BATTING" | "PITCHING" | "FIELDING" | "BASERUNNING";
export type TrendWindow = "LAST_3" | "LAST_5" | "SEASON_TO_DATE" | "CUSTOM";

export interface TeamRow {
  id: Id;
  name: string;
  league_name: string | null;
  age_group: string | null;
  home_city: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SeasonRow {
  id: Id;
  team_id: Id;
  season_year: number;
  season_name: string;
  ruleset_json: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface PlayerRow {
  id: Id;
  team_id: Id;
  first_name: string;
  last_name: string;
  jersey_number: string | null;
  bats: Handedness | null;
  throws_hand: "R" | "L" | null;
  primary_position: string | null;
  active: 0 | 1;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface GameRow {
  id: Id;
  season_id: Id;
  team_id: Id;
  opponent_name: string;
  game_date: ISODate;
  start_time: ISODateTime | null;
  location: string | null;
  home_away: HomeAway;
  status: GameStatus;
  our_final_score: number | null;
  opponent_final_score: number | null;
  innings_scheduled: number;
  current_inning: number | null;
  current_half: HalfInning | null;
  current_outs: number | null;
  current_batting_slot: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface GameLineupRow {
  id: Id;
  game_id: Id;
  player_id: Id;
  batting_order: number;
  starter_flag: 0 | 1;
  entered_in_inning: number | null;
  exited_in_inning: number | null;
  defensive_position: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface PlayEventRow {
  id: Id;
  game_id: Id;
  sequence_no: number;
  inning_no: number;
  half_inning: HalfInning;
  outs_before: number;
  batter_player_id: Id;
  pitcher_player_id: Id | null;
  event_type: string;
  event_code: string;
  description: string | null;
  balls: number | null;
  strikes: number | null;
  runs_scored: number;
  rbi: number;
  earned_run_flag: 0 | 1 | null;
  error_on_play_flag: 0 | 1;
  result_json: string;
  source_event_id: Id | null;
  deleted_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface BaserunnerMovementRow {
  id: Id;
  play_event_id: Id;
  player_id: Id;
  start_base: "BATTER" | "FIRST" | "SECOND" | "THIRD" | null;
  end_base: "FIRST" | "SECOND" | "THIRD" | "HOME" | "OUT" | null;
  advance_reason: string | null;
  out_on_play_flag: 0 | 1;
  run_scored_flag: 0 | 1;
  rbi_credit_flag: 0 | 1;
  created_at: ISODateTime;
}

export interface DefensiveResultRow {
  id: Id;
  play_event_id: Id;
  player_id: Id;
  field_position: string | null;
  result_role: string;
  created_at: ISODateTime;
}

export interface PitchingAppearanceRow {
  id: Id;
  game_id: Id;
  player_id: Id;
  started_flag: 0 | 1;
  sequence_no: number;
  entered_inning: number;
  exited_inning: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface StatLineGameRow {
  id: Id;
  game_id: Id;
  player_id: Id;
  stat_group: StatGroup;
  stats_json: string;
  calculated_at: ISODateTime;
}

export interface StatLineSeasonRow {
  id: Id;
  season_id: Id;
  player_id: Id;
  stat_group: StatGroup;
  stats_json: string;
  calculated_at: ISODateTime;
}

export interface TrendSnapshotRow {
  id: Id;
  season_id: Id;
  player_id: Id;
  metric_code: string;
  window_type: TrendWindow;
  snapshot_date: ISODate;
  metric_value: number;
  metadata_json: string;
  created_at: ISODateTime;
}
```


### Parsed stat interfaces

Because scorekeeping apps need both structured SQL and fast derived reads, I would store JSON in the stat tables but immediately parse it into typed application objects in TypeScript.[^3_2]

```ts
export interface BattingStats {
  games: number;
  plateAppearances: number;
  atBats: number;
  runs: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  hitByPitch: number;
  strikeOuts: number;
  stolenBases: number;
  caughtStealing: number;
  sacrifices: number;
  reachedOnError: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  ops: number;
}

export interface PitchingStats {
  games: number;
  gamesStarted: number;
  inningsPitchedOuts: number;
  battersFaced: number;
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walks: number;
  hitBatters: number;
  strikeOuts: number;
  pitchesThrown: number;
  era: number;
  whip: number;
}

export interface FieldingStats {
  games: number;
  putouts: number;
  assists: number;
  errors: number;
  doublePlays: number;
  chances: number;
  fieldingPercentage: number;
}

export interface BaserunningStats {
  games: number;
  stolenBases: number;
  caughtStealing: number;
  runsScored: number;
}

export interface StatBundle {
  batting?: BattingStats;
  pitching?: PitchingStats;
  fielding?: FieldingStats;
  baserunning?: BaserunningStats;
}
```


### Live scoring domain interfaces

The live scorer should work from a richer in-memory game state than the raw database rows alone, because quick stat entry depends on knowing inning context, runner locations, lineup turn, and pending edits immediately after each recorded play.[^3_9][^3_3]

```ts
export type BaseOccupancy = {
  first: Id | null;
  second: Id | null;
  third: Id | null;
};

export interface ScoreboardState {
  inning: number;
  half: HalfInning;
  outs: number;
  balls: number;
  strikes: number;
  ourScore: number;
  opponentScore: number;
  battingSlot: number;
  bases: BaseOccupancy;
}

export type PlayEventType =
  | "PLATE_APPEARANCE"
  | "BASERUNNING"
  | "DEFENSE"
  | "SUBSTITUTION"
  | "PITCHING_CHANGE"
  | "ADMIN";

export type PlateAppearanceCode =
  | "1B"
  | "2B"
  | "3B"
  | "HR"
  | "BB"
  | "HBP"
  | "SO"
  | "OUT"
  | "ROE"
  | "FC"
  | "SAC"
  | "CI";

export interface RunnerAdvanceInput {
  playerId: Id;
  startBase: "BATTER" | "FIRST" | "SECOND" | "THIRD";
  endBase: "FIRST" | "SECOND" | "THIRD" | "HOME" | "OUT";
  reason?: string;
  rbiCredit?: boolean;
}

export interface RecordPlayCommand {
  gameId: Id;
  inningNo: number;
  halfInning: HalfInning;
  outsBefore: number;
  batterPlayerId: Id;
  pitcherPlayerId?: Id | null;
  eventType: PlayEventType;
  eventCode: PlateAppearanceCode | string;
  description?: string | null;
  balls?: number | null;
  strikes?: number | null;
  runsScored?: number;
  rbi?: number;
  earnedRunFlag?: boolean | null;
  errorOnPlayFlag?: boolean;
  runnerAdvances: RunnerAdvanceInput[];
  defensiveResults?: Array<{
    playerId: Id;
    fieldPosition?: string | null;
    resultRole: string;
  }>;
  result?: Record<string, unknown>;
}

export interface LiveGameState {
  game: GameRow;
  lineup: Array<GameLineupRow & { player: PlayerRow }>;
  scoreboard: ScoreboardState;
  currentBatter: PlayerRow | null;
  currentPitcher: PlayerRow | null;
  recentEvents: PlayEventRow[];
}
```


## Notes

I would keep IDs as text UUIDs rather than integer autoincrements because that makes offline creation, later sync, and record merging easier across devices or exported files. I would also make the SQL schema the primary source of truth and either hand-maintain or generate the TypeScript row interfaces from it, since schema-first typing reduces drift between storage and app code.[^3_10][^3_2]

The one design choice I would stress is this: keep `play_events`, `baserunner_movements`, and lineup tables highly structured, but allow `stats_json`, `ruleset_json`, and some result payloads to stay flexible. That balance gives you strict integrity for game history and enough freedom to handle youth-league rule variations without turning the MVP into a huge normalization project.[^3_7][^3_11][^3_3]

Would you like the next step to be repository/query examples for SQLite plus TypeScript, or the stat derivation logic for batting, pitching, and fielding?
<span style="display:none">[^3_12][^3_13][^3_14][^3_15][^3_16][^3_17]</span>

<div align="center">⁂</div>

[^3_1]: https://sqlite.org/foreignkeys.html

[^3_2]: https://effectivetypescript.com/2023/08/29/sql/

[^3_3]: https://www.littleleague.org/university/articles/scorekeeping-101/

[^3_4]: https://gorout.com/baseball-scorekeeping/

[^3_5]: https://stackoverflow.com/questions/18387209/sqlite-syntax-for-creating-table-with-foreign-key

[^3_6]: https://www.sqlitetutorial.net/sqlite-foreign-key/

[^3_7]: https://www.sqliteforum.com/p/sqlite-best-practices-review

[^3_8]: https://stackoverflow.com/questions/37652801/when-to-use-interface-and-model-in-typescript-angular

[^3_9]: https://www.mlb.com/official-information/basics/score

[^3_10]: https://github.com/waynenilsen/bun-sqlite-generate

[^3_11]: https://www.tomballlittleleague.com/LinkClick.aspx?fileticket=8rqAR9XcOT4%3D\&tabid=1455379\&portalid=3823

[^3_12]: https://www.reddit.com/r/SQL/comments/s2w4ia/sqlite_what_are_the_best_practices_for_indexing/

[^3_13]: https://dbschema.com/blog/sqlite/index/

[^3_14]: https://www.sql-easy.com/learn/sqlite-foreign-key/

[^3_15]: https://www.youtube.com/watch?v=hbJG6JjZUZI

[^3_16]: https://www.reddit.com/r/typescript/comments/nfnnvz/backend_when_to_use_interfaces_with_database/

[^3_17]: https://www.reddit.com/r/BaseballScorecards/comments/1dmrc4w/baseball_101_advice_for_a_rookie_scorekeeper/

