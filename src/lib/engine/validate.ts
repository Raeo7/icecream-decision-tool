import { capacityFor, type MachineCopy } from "@/lib/engine/machines";
import { totalProduction, type Decision, type Flag } from "@/lib/engine/types";
import { findPremise, type Rules } from "@/lib/rules";

/**
 * `owned` must be the machines held AFTER this season's purchases. Given only the opening
 * machines, a machine bought and installed in the same season — which is exactly what
 * Year 1 winter did — would read as zero capacity and be blocked wrongly.
 *
 * `lowestCash` is the lowest balance the season reaches at any step; the caller computes it.
 */
export function validate(
  decision: Decision,
  owned: MachineCopy[],
  unitsSold: number,
  rules: Rules,
  lowestCash: number,
): Flag[] {
  const flags: Flag[] = [];
  const stop = (message: string) => flags.push({ severity: "violation", message });
  const warn = (message: string) => flags.push({ severity: "advisory", message });

  for (const rental of decision.rentals) {
    const premise = findPremise(rules, rental.premiseId);
    if (premise === undefined) {
      stop(`Premise ${rental.premiseId} is not in these rules.`);
      continue;
    }
    if (rental.installedUids.length > premise.slots) {
      stop(
        `Premise ${premise.id} has ${premise.slots} machine slot(s), but ${rental.installedUids.length} machines are installed there.`,
      );
    }
    const here = capacityFor(rental.installedUids, owned, rules);
    if (rental.production > here) {
      stop(
        `You plan ${rental.production.toLocaleString()} ice creams at premise ${premise.id} but the machines installed there make at most ${here.toLocaleString()}.`,
      );
    }
  }

  const running = decision.rentals.flatMap((rental) => rental.installedUids);
  if (new Set(running).size !== running.length) {
    stop("A machine can only run in one premise at a time.");
  }
  if (decision.rentals.length !== new Set(decision.rentals.map((r) => r.premiseId)).size) {
    stop("A premise can only be rented once in a season.");
  }

  const production = totalProduction(decision);
  const capacity = capacityFor(running, owned, rules);

  const milkUnits = decision.milkTons * rules.unitsPerTon;
  if (production > milkUnits) {
    stop(
      `You plan ${production.toLocaleString()} ice creams but your milk yields only ${milkUnits.toLocaleString()}.`,
    );
  }

  // Milk becomes ice cream on its own. Producing less than the milk and machines allow spends
  // the same on milk while leaving fewer ice creams to sell, so it is never worth doing.
  const couldProduce = Math.min(milkUnits, capacity);
  if (production < couldProduce) {
    warn(
      `Your milk and machines make ${couldProduce.toLocaleString()} ice creams, but you plan only ${production.toLocaleString()}. Milk turns into ice cream automatically, and the milk is paid for either way.`,
    );
  }

  if (decision.salesRequest % rules.requestBlock !== 0) {
    stop(`Requests must be whole blocks of ${rules.requestBlock.toLocaleString()}.`);
  }
  if (decision.salesRequest > production) {
    stop(
      `You requested ${decision.salesRequest.toLocaleString()} but produce only ${production.toLocaleString()}.`,
    );
  }
  if (unitsSold > decision.salesRequest) {
    stop("Units sold cannot exceed units requested.");
  }
  if (decision.marketInvestment < rules.minMarket) {
    stop(
      `Market investment must be at least Sh ${rules.minMarket.toLocaleString()}, even in a season you sit out.`,
    );
  }
  if (decision.milkTons < rules.minMilkTons) {
    stop(
      `You must buy at least ${rules.minMilkTons} ton of milk every season, even in a season you sit out.`,
    );
  }

  if (decision.loan !== null) {
    if (decision.loan.principal <= 0) stop("A loan must have a positive amount.");
    if (decision.loan.termSeasons < 1 || decision.loan.termSeasons > rules.maxLoanTerm) {
      stop(`Loan terms run from 1 to ${rules.maxLoanTerm} seasons.`);
    }
  }

  if (lowestCash < 0) {
    stop(
      `Cash falls to Sh ${lowestCash.toLocaleString()} during the season. Take a loan before the payment that breaks it.`,
    );
  }

  if (rules.isEstimate) {
    warn(
      "Year 2 prices here are Year 1 figures carried forward as estimates, not confirmed prices.",
    );
  }
  for (const machine of owned) {
    if (machine.seasonsDepreciated >= rules.depreciationSeasons) {
      warn(
        `Machine ${machine.uid} is fully depreciated: it still costs maintenance but makes nothing.`,
      );
    }
  }

  return flags;
}
