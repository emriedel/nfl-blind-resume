# QB Matchup App Spec

## Matchup Rules

-   Avoid repeating the same matchup too often for one user
    (particularly within one session).
-   The user must pick one of the two players to continue.
-   There should be a UI reveal of who the two players are.
-   After voting, the app should smoothly transition to the next
    matchup.

## Player Data

-   Start with QB seasons only.
-   Display **traditional box score stats** along with the **win/loss
    record** (if available).
-   Include **year** and **team** for each season for context.
-   Only include **regular season stats** for now.
-   Apply minimum thresholds to filter included seasons:
    -   Games Played: **8+**
    -   Pass Attempts: **200+**

## ELO Rating System

-   Initial ELO seeded with a simple heuristic (e.g., based on passing
    yards or passer rating).
-   Use a **standard chess-like K-factor** (default: 32).
-   ELO updates should occur **after each user vote** (ensures fast
    convergence).
-   Inactive scores should **not decay over time**.

## Standings Page

-   Allow sorting by **year** and **team**.
-   Display both **ELO score** and **rank**.
-   Also display **box score stats** used in the comparisons.

## UX / UI

-   Player comparisons should be displayed **side by side** (desktop &
    mobile-friendly).
-   Mobile view may need an adjusted layout but should still allow easy
    side-by-side comparison.
-   Track user sessions with **cookies / localStorage**.
