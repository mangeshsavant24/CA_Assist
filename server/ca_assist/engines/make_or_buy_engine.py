from api.schemas import MakeOrBuyInput, MakeOrBuyOutput, MakeOrBuyOption
from typing import Dict


class MakeOrBuyEngine:
    """Engine for make-or-buy decision analysis."""

    def evaluate(self, request: MakeOrBuyInput) -> MakeOrBuyOutput:
        """
        Analyze make vs buy decision using quantitative and qualitative factors.
        """
        # Calculate total costs for each option
        total_costs = self._calculate_total_costs(
            request.options, request.analysis_period_years
        )

        # NPV analysis comparing options
        npv_analysis = self._perform_npv_analysis(
            request.options, request.analysis_period_years, request.discount_rate
        )

        # Evaluate qualitative factors
        qualitative_factors = self._evaluate_qualitative_factors(request.options)

        # Risk assessment
        risk_assessment = self._assess_risks(request.options)

        # Determine recommendation
        recommended_option = self._determine_recommendation(
            total_costs, npv_analysis, qualitative_factors
        )

        return MakeOrBuyOutput(
            product_name=request.product_name,
            recommended_option=recommended_option,
            total_costs_comparison={
                opt.option_name: round(total_costs[opt.option_name], 2)
                for opt in request.options
            },
            npv_analysis=npv_analysis,
            qualitative_factors=qualitative_factors,
            risk_assessment=risk_assessment,
            recommendation=self._generate_detailed_recommendation(
                recommended_option, total_costs, qualitative_factors
            ),
            currency=request.currency,
        )

    def _calculate_total_costs(self, options: list, years: int) -> Dict[str, float]:
        """Calculate total cost of ownership for each option."""
        costs = {}
        for opt in options:
            total_cost = opt.setup_cost + (opt.per_unit_cost * opt.annual_volume * years)
            costs[opt.option_name] = total_cost
        return costs

    def _perform_npv_analysis(
        self, options: list, years: int, discount_rate: float
    ) -> Dict:
        """Perform NPV analysis for each option."""
        npv_analysis = {}
        rate = discount_rate / 100.0

        for opt in options:
            npv = -opt.setup_cost
            annual_cost = opt.per_unit_cost * opt.annual_volume

            for year in range(1, years + 1):
                npv -= annual_cost / ((1 + rate) ** year)

            npv_analysis[opt.option_name] = round(npv, 2)

        return npv_analysis

    def _evaluate_qualitative_factors(self, options: list) -> Dict:
        """Evaluate non-financial factors."""
        factors = {}

        for opt in options:
            factor_score = {
                "quality_score": opt.quality_score,
                "lead_time_days": opt.lead_time_days,
                "reliability": (
                    opt.supplier_reliability if opt.supplier_reliability else "Not Specified"
                ),
            }
            factors[opt.option_name] = factor_score

        return factors

    def _assess_risks(self, options: list) -> str:
        """Assess risks for each option."""
        make_option = next((o for o in options if o.option_name.lower() == "make"), None)
        buy_option = next((o for o in options if o.option_name.lower() == "buy"), None)

        risks = []

        if make_option:
            risks.append(
                f"In-house production: Capital investment, operational complexity, "
                f"{make_option.lead_time_days}-day lead time"
            )

        if buy_option:
            risks.append(
                f"Outsourcing: Supplier dependency, quality variability, "
                f"{buy_option.lead_time_days}-day lead time"
            )

        return "; ".join(risks) if risks else "No significant risks identified"

    def _determine_recommendation(
        self, total_costs: Dict, npv_analysis: Dict, qualitative: Dict
    ) -> str:
        """Determine best option based on all factors."""
        # Find option with lowest cost
        cheapest = min(total_costs, key=total_costs.get)

        # Check if quality/reliability tips the scales
        for option_name, factors in qualitative.items():
            if factors.get("quality_score", 0) > 85 and option_name != cheapest:
                if total_costs[option_name] < total_costs[cheapest] * 1.1:
                    return option_name

        return cheapest

    def _generate_detailed_recommendation(
        self, recommended: str, costs: Dict, qualitative: Dict
    ) -> str:
        """Generate detailed recommendation with justification."""
        recommended_cost = costs[recommended]
        cost_diff = min(
            (costs[opt] - recommended_cost)
            for opt in costs
            if opt != recommended
        )

        rec_quality = qualitative[recommended].get("quality_score", 0)

        if cost_diff < recommended_cost * 0.05:
            return (
                f"Recommend '{recommended}' (cost difference minimal). "
                "Other factors (quality, lead time, risk) are equally important."
            )
        else:
            savings = abs(cost_diff)
            return (
                f"Recommend '{recommended}' (saves ₹{savings:,.0f}). "
                f"Quality score: {rec_quality}/100. Ensure supply chain stability maintained."
            )
