<!-- Keep PRs small — under ~300 lines, one logical change. Small PRs get reviewed;
     giant PRs get rubber-stamped. Open as a Draft early so teammates + CI see it. -->

## What & why

<!-- One or two sentences. What does this change and why? -->

Closes #<!-- issue number -->

## Services affected

<!-- Check all that apply -->

- [ ] backend
- [ ] frontend-client
- [ ] frontend-admin
- [ ] shared (UI components)

## How to test

<!-- Steps a reviewer runs to verify it works. -->

## Review checklist (author ticks before requesting review)

- [ ] Does what the linked issue asks
- [ ] Runs locally / CI is green
- [ ] **No secrets, `.env`, keys, or tokens committed** (`.env.example` updated if new vars)
- [ ] Small and focused, reasonable names, no dead code
- [ ] If UI components changed, both frontends are in sync
- [ ] A teammate (not me) will review — I will **not** self-merge
