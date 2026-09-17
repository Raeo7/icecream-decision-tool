# Pork & Garlic Ice Cream — Year 2 Decision Tool

My model of Team 7's company, built for Day 1 Home Assignment 1. The team decides the seasons
together; this is my own accounting model of them, and my own comparison of Year 2 winter
strategies from the position Year 1 closes at.

Built with Next.js and TypeScript. The accounting is a separate layer with no React in it, so the
figures can be tested against the handout directly.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # types, lint and tests
```

## What it does

### Year 1

Winter is the season the company played, seeded from my own workbook: premise D, one Machine 1,
3.5 tons of milk, Sh 5,000 on the market, a 50,000 loan over eight seasons, and the 20,000 ice
creams the trainer allocated. Spring, summer and autumn are my own projection — each one is
entered by hand and the year runs on from the position the season before it closed at.

Only seasons that have actually been played count. A projection is shown in full, so the form is
worth filling in before the season is played, but it is not added into the year's profit and it is
not carried into Year 2 as though it had happened. A season marked played joins both.

Every season shows its profit and loss, its cash flow, and any rule it breaks, and the year table
says which seasons are legal so a plan that would run cash negative is visible without opening it.

**Checking it against the classroom model.** The assignment asks for one real Year 1 season to
reconcile against the model I keep by hand, so winter has a panel for exactly that: type
the workbook's net profit and closing cash and the page says whether they match and by how much if
not. Two models built from the same rules that disagree mean one of them is wrong, and until they
agree neither is worth deciding from. This app reports **−75,175** net profit and **37,950**
closing cash for winter.

### Year 2 winter

Opens on where Year 1 actually stands — the position after the last season really played, with
cash, machines and their remaining lives, loans still outstanding, unused tax losses, and the
profit of the seasons played so far.

Two options are set up to compare, and more can be added. Each carries a full decision — premises
rented, machines running in each, milk bought, ice creams requested, market investment and
borrowing — and three possible allocations, because the forecast is not a promise: the trainer
divides the market in class, and the real market runs up to 20% either side of the forecast.

For each option and each allocation the page shows projected profit and loss (including
depreciation, interest and the tax loss carried forward), projected cash flow and closing cash,
the share of the forecast market it represents, the units it must sell to break even, and a count
of any rule it breaks. A second panel puts two options side by side line by line — sales,
spoilage, rent, machine costs, transport, market spending, interest — so the difference between
them is in shekels rather than in impressions.

The last panel records the chosen strategy, why, and the most important assumption behind it.

**Year 2 prices are estimates.** The trainer publishes the real Year 2 rules, premises and machines
in class. Until then every price on the page is a Year 1 figure carried forward, is labelled as an
estimate, and is editable. Nothing here presents a Year 1 price as a confirmed Year 2 price.

## How the figures are worked out

The rules are in `src/lib/rules.ts` and the accounting in `src/lib/engine/`. It is plain
TypeScript with no React and no input or output, and it never throws: a broken rule comes back as
a flag on the result, so the same checks run behind a season already recorded and an option still
being weighed.

It is tested against the handout rather than against itself. The worked examples in the handout
are tests: the section 11 season, the loan schedule with its declining-balance interest, and the
transport example that makes 60,000 at premise A and 40,000 at premise B, sells 70,000, splits the
sale 42,000 and 28,000 in the ratio produced, and pays Sh 23,800 to move it.

A few things the rules decide that are easy to get wrong, and which the engine gets right:

- Maintenance and depreciation are charged on every machine **owned**, running or idle.
- There is no dormant season. Sitting out still costs the minimum market investment, one ton of
  milk and the fixed salaries.
- Milk and ice cream spoil at season end in Year 1. Nothing carries into the next season.
- A loan pays its own first instalment in the season it is taken.
- Cash may never be negative — not only at season end, but before each payment made in advance.
- Money rounds halves away from zero, to match the spreadsheets the class keeps.

## Layout

| Path               | What lives there                                                    |
| ------------------ | ------------------------------------------------------------------- |
| `src/lib/rules.ts` | Premises, machines, forecasts and the Year 1 rule constants         |
| `src/lib/engine/`  | Profit and loss, cash flow, loans, machines, validation, the season |
| `src/lib/state.ts` | The saved game and localStorage                                     |
| `src/components/`  | The panels                                                          |
| `src/app/page.tsx` | Year 1                                                              |
| `src/app/year2/`   | Year 2 winter                                                       |

The game is saved in the browser as you type. A save this version cannot read is set aside rather
than written over, because the figures in it were entered by hand.
