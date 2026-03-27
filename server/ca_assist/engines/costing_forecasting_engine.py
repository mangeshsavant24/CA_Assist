from api.schemas import CostingForecastInput, CostingForecastOutput
from typing import List


class CostingForecastingEngine:
    """Engine for costing analysis and profit/loss forecasting."""

    def evaluate(self, request: CostingForecastInput) -> CostingForecastOutput:
        """
        Perform costing analysis and forecast profit/loss over multiple periods.
        """
        # Calculate breakeven point
        breakeven_point = self._calculate_breakeven(
            request.fixed_costs,
            request.variable_cost_per_unit,
            request.selling_price_per_unit,
        )

        # Calculate contribution margin
        contribution_margin_per_unit = (
            request.selling_price_per_unit - request.variable_cost_per_unit
        )
        contribution_margin_ratio = (
            (contribution_margin_per_unit / request.selling_price_per_unit * 100)
            if request.selling_price_per_unit > 0
            else 0
        )

        # Forecast profit/loss for each period
        forecasted_profit_loss = self._forecast_periods(
            request.fixed_costs,
            request.variable_cost_per_unit,
            request.selling_price_per_unit,
            request.forecasted_units,
        )

        total_forecast_profit = sum(forecasted_profit_loss)

        # Generate recommendation
        recommendation = self._generate_recommendation(
            breakeven_point, total_forecast_profit, contribution_margin_ratio
        )

        return CostingForecastOutput(
            project_name=request.project_name,
            breakeven_point=round(breakeven_point, 2),
            contribution_margin_per_unit=round(contribution_margin_per_unit, 2),
            contribution_margin_ratio=round(contribution_margin_ratio, 2),
            forecasted_profit_loss=[round(p, 2) for p in forecasted_profit_loss],
            total_forecast_profit=round(total_forecast_profit, 2),
            recommendation=recommendation,
            currency=request.currency,
        )

    def _calculate_breakeven(
        self, fixed_costs: float, variable_cost: float, selling_price: float
    ) -> float:
        """Calculate breakeven point in units."""
        if selling_price <= variable_cost:
            return float("inf")  # No breakeven if margin is zero or negative
        
        contribution_margin = selling_price - variable_cost
        breakeven = fixed_costs / contribution_margin
        return breakeven

    def _forecast_periods(
        self,
        fixed_costs: float,
        variable_cost_per_unit: float,
        selling_price_per_unit: float,
        forecasted_units: List[int],
    ) -> List[float]:
        """Forecast profit/loss for each period."""
        forecast = []
        for units in forecasted_units:
            revenue = units * selling_price_per_unit
            total_variable_cost = units * variable_cost_per_unit
            profit_loss = revenue - total_variable_cost - fixed_costs
            forecast.append(profit_loss)
        return forecast

    def _generate_recommendation(
        self, breakeven: float, total_profit: float, margin_ratio: float
    ) -> str:
        """Generate recommendation based on analysis."""
        if total_profit < 0:
            return (
                f"Projected losses. Recommend reviewing pricing strategy "
                f"or reducing fixed costs. Breakeven: {breakeven:.0f} units."
            )
        elif breakeven > 100000:
            return (
                f"High breakeven point ({breakeven:.0f} units). "
                "Consider reducing fixed costs or improving unit margins."
            )
        elif margin_ratio < 20:
            return (
                f"Low contribution margin ({margin_ratio:.1f}%). "
                "Monitor for profitability. Consider pricing optimization."
            )
        else:
            return (
                f"Healthy projection with {total_profit:.0f} profit and "
                f"{margin_ratio:.1f}% contribution margin. Breakeven at {breakeven:.0f} units."
            )
