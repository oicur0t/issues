# Features — Spec

Status: v1 implemented (feature comments deferred to v1.1; no dashboard card yet) · Scope: new top-level "Features" module alongside Issues, Wiki, Assets.

## 1. Purpose

Issues track *work that is broken or needs doing*. The wiki tracks *knowledge*. Assets track *infrastructure*. Nothing tracks *what we intend to build and where it stands*. A **Feature** is a user-visible capability, owned by a project, that moves from idea to shipped and is delivered through one or more issues.

Primary users: 1–2 human devs, 2–3 AI devs, 1 AI PM. The AI PM creates and grooms features; AI/human devs pick up the linked issues. Everything must be fully usable via REST and MCP, not only the UI.

## 2. Design principles (follow existing conventions)

- Same layering as Assets/Issues: `lib/types/feature.ts` → server actions in `app/features/actions.ts` → thin REST routes in `app/api/v1/features/` → UI in `app/features/` → MCP tools.
- Auth via `requireUnifiedAuth` in the action (not the route). Read = `viewer`, write = `developer`. Errors via `handleApiError` / `isApiAuthError`.
- Project-scoped with human-readable IDs, like issues. Lookups accept an ObjectId **or** the readable number (as `getIssue` already does).
- Statuses are lowercase snake_case string unions, like `IssueStatus`.
- Neobrutalist UI using the existing `components/ui/*` primitives and the Inline*Edit pattern.

## 3. Data model

New collection `features`.

```ts
export type FeatureStatus = 'proposed' | 'planned' | 'in_progress' | 'shipped' | 'dropped'
export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical'   // reuse IssuePriority

export interface Feature {
  _id?: ObjectId
  projectId: ObjectId
  featureNumber: string        // "CUS-F001"
  title: string
  description: string          // markdown: problem, desired behaviour
  acceptanceCriteria: string   // markdown checklist ("- [ ] ...")
  status: FeatureStatus
  priority: FeaturePriority
  ownerId?: ObjectId           // user (human or AI) accountable for it
  wikiSlug?: string            // optional link to a design/spec wiki page
  tags: string[]
  targetDate?: Date
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  shippedAt?: Date             // set automatically when status -> shipped
}
```

Standard `CreateFeatureData`, `UpdateFeatureData`, `FeatureFilter` (projectId, status[], priority[], ownerId, tags, search), and `FeatureWithDetails` (adds `project`, `owner`, `creator`, `progress`) as in `asset.ts`.

### Changes to existing models

| Model | Change | Migration |
|---|---|---|
| `Issue` | add optional `featureId?: ObjectId` (one feature → many issues; an issue belongs to at most one feature) | none — field is optional |
| `Project` | add `featureCounter: number` | `$inc` upsert tolerates missing field; optionally backfill to 0 |
| `Comment` | v1.1 only: make `issueId` optional, add optional `featureId` | none |

Add an index on `issues.featureId` and a unique index on `features.featureNumber` (mirrors `scripts/add-issue-number-unique-index.js`).

### Derived: progress

Computed at read time from linked issues, not stored (avoids drift, which this repo has already fought with `issueCounter`):

```
progress = { total, done: count(status in [fixed]), inProgress, blocked, percent }
```
`wont_fix` is excluded from the total.

### Status behaviour

- `proposed` → `planned` → `in_progress` → `shipped`; `dropped` reachable from any state. Any transition is allowed (no enforced workflow, same as issues).
- Setting `shipped` stamps `shippedAt`. Shipping with open linked issues is **allowed** but the response includes a `warnings: ["3 linked issues still open"]` field — useful signal for the AI PM without blocking.

## 4. REST API (`/api/v1`)

| Method | Path | Notes |
|---|---|---|
| GET | `/features` | filters: `projectId, status, priority, ownerId, tags, search`; standard pagination |
| POST | `/features` | required: `projectId, title, description` |
| GET | `/features/[id]` | id = ObjectId or `CUS-F001`; includes `progress` |
| PUT | `/features/[id]` | partial update |
| DELETE | `/features/[id]` | unlinks issues (`$unset featureId`), does not delete them |
| GET | `/features/[id]/issues` | linked issues |
| POST | `/features/[id]/issues` | body `{ issueId }` — link existing issue |
| DELETE | `/features/[id]/issues/[issueId]` | unlink |

Also: `POST/PUT /issues` accept `featureId`, and `GET /issues` accepts `?featureId=` so a dev agent can ask "what's left on this feature".

Comments (v1.1): `GET/POST /features/[id]/comments`, reusing the comments action.

## 5. MCP tools (`mcp-server/src/index.ts`)

Matches existing naming: `list_features`, `get_feature`, `create_feature`, `update_feature`, `delete_feature`, `link_issue_to_feature`, `unlink_issue_from_feature`, plus (v1.1) `get_feature_comments` / `add_feature_comment`. Add `Feature*` types to `mcp-server/src/types.ts` and methods to `client.ts`. Add `featureId` to `create_issue`/`update_issue`/`list_issues`.

Note: the MCP server currently has **no asset tools** (only issues, projects, users, wiki, comments), so the "all modules in MCP" convention is not fully met today. Out of scope here, but worth a follow-up issue.

## 6. UI

- Nav: add **Features** (lucide `Lightbulb`/`Sparkles`) between Issues and Assets; quick action "New Feature".
- `/features` — list with status/priority/project filters and search; each card shows number, title, status badge, priority, owner, progress bar. Optional toggle between list and a 5-column status board (read-only columns; status changed via inline select — no drag-and-drop in v1).
- `/features/[id]` — inline-editable title/description/acceptance criteria/status/priority/owner/tags/target date; "Linked issues" panel (with progress bar, add/remove link, "New issue for this feature" prefilled); wiki link.
- `/features/new`, and a `Feature` selector on the issue form + a feature chip on issue detail/cards.
- Dashboard: one stat card (features by status) like the existing Assets card.

## 7. Implementation plan

1. Types + `featureCounter` + indexes (`lib/types/feature.ts`, export in `index.ts`, script in `scripts/`).
2. `app/features/actions.ts` (create/get/list/update/delete/link/unlink, number generation via `findOneAndUpdate $inc`, progress aggregation).
3. REST routes + `featureId` on issue routes/actions.
4. MCP tools/types/client + README table.
5. UI pages/components, nav, dashboard card.
6. Tests in the style of `test-api.ts` / `test-full-workflow.ts`: CRUD, number generation, link/unlink, progress, 401/403.
7. README feature list update.

Estimate: ~1–1.5 days of agent time for steps 1–4 (fully usable by AI devs/PM), ~1 day for UI.

**Deliberately out of v1:** feature comments, milestones/releases, dependencies, voting/scoring, notifications, drag-and-drop board.

## 8. Stretch: ideas from other platforms

Effort is relative to this codebase *after* Features exists. S = hours, M = ~1 day, L = several days.

| Idea | Source | What it is | Effort | Fit for a 5-person human+AI team |
|---|---|---|---|---|
| **Agent claim / assignment lock** | (AI-native) | `claimedBy` + `claimedAt` on issues; `claim_issue` fails if already claimed; auto-expire after N hours | S | **High.** Prevents 2–3 AI devs grabbing the same issue. Cheapest big win |
| **`get_next_work` MCP tool** | (AI-native) | Returns the highest-priority unclaimed, unblocked issue, optionally scoped to a feature/project | S | **High.** Makes the AI devs self-serve from the PM's grooming |
| **Issue relations** (blocks / blocked-by / duplicates) | Linear, Jira | `relations: [{type, issueId}]` on issues; blocked issues excluded from `get_next_work` | M | High; also makes the existing `blocked` status meaningful |
| **Activity log / audit trail** | Linear, GitHub | Append-only `activity` collection (who/what/when, user kind human vs AI); shown on feature/issue pages | M | **High** for trust — you can see what each AI changed. Write in the shared update helper |
| **Acceptance-criteria checklist parsing** | Jira, Shortcut | Parse `- [ ]` items in markdown, show done/total on cards | S | Medium. Free given criteria are already markdown |
| **Sub-issues / parent-child** | Linear, GitHub | `parentId` on issues, rolled-up progress | S–M | Medium; Features already cover the main grouping need — avoid doing both early |
| **PM status update / digest** | Linear Project Updates | `status_updates` doc per project/feature (on-track, at-risk, blocked + text), authored by the AI PM; latest shown on feature page | S | **High.** The AI PM's natural output; could just be a typed comment |
| **Triage inbox** | Linear Triage | Issues from AI devs land in a `triage` state until the PM accepts/rejects | S | Medium. Adds one status; good guard against AI-generated noise |
| **Milestones / cycles (sprints)** | Linear, Shortcut | Named time-box; features/issues belong to one | M | Medium. Probably overkill at this team size — `targetDate` covers most of it |
| **Roadmap (timeline) view** | Productboard, Linear | Features laid out by `targetDate`/status | M | Low–medium, UI-only once `targetDate` exists |
| **Custom fields** | GitHub Projects, Jira | Per-project user-defined fields | L | Low. Tags already cover most uses |
| **Saved views / filters** | Linear, GitHub | Persist a filter set with a name | S–M | Medium |
| **Webhooks / event stream** | GitHub, Linear | POST on create/update to a URL (or SSE) so agents can react rather than poll | M | Medium-high once agents run unattended |
| **Feature scoring (RICE/ICE)** | Productboard | Numeric `impact`, `effort`, `confidence` → computed score for the PM to rank | S | Medium; AI PM can fill in and sort |
| **Shape Up "appetite" + hill chart** | Basecamp | Time budget per feature; progress as uphill/downhill | S (appetite) / M (hill) | Appetite is a cheap, useful field; skip hill charts |
| **Voting / customer insights** | Productboard | Link feedback to features | M | Low for internal team |
| **Releases / changelog** | Jira Versions, Linear | `releases` grouping shipped features; auto-generate changelog | M | Medium; natural follow-up since `shippedAt` is stored |
| **Git / PR linking** | GitHub, Linear | Store PR URL on issue; auto-close on merge | M | Medium; AI devs can just `update_issue` with a `prUrl` field (S) without the automation |

### Recommendation

After Features, do these in order — all small and aimed at multi-agent coordination:
1. **Agent claim + `get_next_work`** (S + S)
2. **Activity log** (M)
3. **PM status updates** (S)
4. **Issue relations** (M)
5. **Triage state** (S)

Skip for now: cycles, custom fields, voting, hill charts.

## 8a. Status of the stretch ideas (as of build 9)

Done: **agent claim lock** (`claim_issue`, `release_issue`, expiry via `CLAIM_TTL_HOURS`), **`get_next_work`**, and **`get_my_work`** (a `mine=true` filter on the issues list). See "Working with AI agents" in the README.

Not done yet: activity log, PM status updates, issue relations, triage state, feature comments (deferred from v1), feature scoring, releases/changelog. Also tracked in the README roadmap.

Related modules built on the same conventions: **Assets** (grouping, editing, custom fields) and the **Tailscale discovery** (docs/TAILSCALE_SYNC.md).

## 9. Open questions

1. Feature number format: `CUS-F001` (proposed, distinct from issue `CUS-001`) vs. sharing the issue counter?
2. Should an issue be allowed under multiple features? Proposed: no (one `featureId`), for simplicity.
3. Is `proposed → planned → in_progress → shipped / dropped` the right vocabulary?
4. Ship feature comments in v1 rather than v1.1? It touches the `Comment` type, so it's split out to keep v1 additive-only.
