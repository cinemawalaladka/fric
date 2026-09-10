"use server";

import { createClient } from "@/lib/supabase/server";
import { type EligibilityResult } from "@/types";

export async function checkEligibility(
  claimTypeCode: string,
  details: Record<string, string | number | boolean>
): Promise<EligibilityResult> {
  try {
    const supabase = await createClient();

    // 1. Get the claim type
    const { data: claimType, error: typeError } = await supabase
      .from("claim_types")
      .select("id, name")
      .eq("code", claimTypeCode)
      .single();

    if (typeError || !claimType) {
      return {
        isEligible: false,
        category: null,
        estimatedAmount: null,
        matchedRule: null,
        reasons: ["Invalid claim type specified."],
      };
    }

    // 2. Fetch all active incentive rules with criteria for this claim type
    const { data: rules, error: rulesError } = await supabase
      .from("incentive_rules")
      .select(`
        id,
        category,
        amount,
        status,
        criteria:rule_criteria (
          criterion,
          operator,
          value
        )
      `)
      .eq("claim_type_id", claimType.id)
      .eq("status", "ACTIVE");

    if (rulesError || !rules || rules.length === 0) {
      return {
        isEligible: false,
        category: null,
        estimatedAmount: null,
        matchedRule: null,
        reasons: ["No active incentive policy rules found for this claim type."],
      };
    }

    const reasons: string[] = [];

    // 3. Evaluate each rule
    for (const rule of rules) {
      let isMatch = true;
      const ruleCriteria = rule.criteria || [];

      if (ruleCriteria.length === 0) {
        // If there are no criteria, it is a default/fallback rule
        return {
          isEligible: true,
          category: rule.category,
          estimatedAmount: Number(rule.amount),
          matchedRule: rule as any,
          reasons: ["Matched standard fallback incentive category."],
        };
      }

      for (const criterion of ruleCriteria) {
        const detailValue = details[criterion.criterion];
        
        if (detailValue === undefined) {
          isMatch = false;
          reasons.push(`Missing detail parameter: ${criterion.criterion}`);
          break;
        }

        const criteriaValue = criterion.value;
        const valString = String(detailValue).toLowerCase().trim();
        const criterionValString = criteriaValue.toLowerCase().trim();

        switch (criterion.operator) {
          case "EQUALS":
            if (valString !== criterionValString) isMatch = false;
            break;
          case "NOT_EQUALS":
            if (valString === criterionValString) isMatch = false;
            break;
          case "GREATER_THAN":
            if (Number(valString) <= Number(criterionValString)) isMatch = false;
            break;
          case "LESS_THAN":
            if (Number(valString) >= Number(criterionValString)) isMatch = false;
            break;
          case "GREATER_EQUAL":
            if (Number(valString) < Number(criterionValString)) isMatch = false;
            break;
          case "LESS_EQUAL":
            if (Number(valString) > Number(criterionValString)) isMatch = false;
            break;
          case "IN": {
            const list = criterionValString.split(",").map((s: string) => s.trim());
            if (!list.includes(valString)) isMatch = false;
            break;
          }
          default:
            isMatch = false;
        }

        if (!isMatch) {
          reasons.push(
            `Did not meet criteria: ${criterion.criterion} must be ${criterion.operator.toLowerCase().replace("_", " ")} ${criterion.value} (got "${detailValue}")`
          );
          break;
        }
      }

      if (isMatch) {
        return {
          isEligible: true,
          category: rule.category,
          estimatedAmount: Number(rule.amount),
          matchedRule: rule as any,
          reasons: ["Successfully matched policy eligibility rules."],
        };
      }
    }

    // Default response if no rules matched
    return {
      isEligible: false,
      category: null,
      estimatedAmount: null,
      matchedRule: null,
      reasons: [
        "Your claim details do not meet the minimum criteria for any active incentive category.",
        ...reasons,
      ],
    };
  } catch (err) {
    console.error("Eligibility check error:", err);
    return {
      isEligible: false,
      category: null,
      estimatedAmount: null,
      matchedRule: null,
      reasons: ["Internal error checking eligibility."],
    };
  }
}
