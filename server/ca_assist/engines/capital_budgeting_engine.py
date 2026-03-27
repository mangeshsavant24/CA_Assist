from api.schemas import CapitalBudgetInput, CapitalBudgetOutput

class CapitalBudgetingEngine:
    def evaluate(self, request: CapitalBudgetInput) -> CapitalBudgetOutput:
        r = request.discount_rate / 100.0
        npv = -request.initial_investment
        pv_cash_flows = 0.0
        cumulative = 0.0

        for t, cf in enumerate(request.cash_flows, start=1):
            pv = cf / ((1 + r) ** t)
            pv_cash_flows += pv
            cumulative += cf

        npv += pv_cash_flows

        # IRR via incremental search
        irr = self._approximate_irr(request.initial_investment, request.cash_flows)

        # Payback period (simple, not discounted)
        cumulative = 0.0
        payback_period = None
        for t, cf in enumerate(request.cash_flows, start=1):
            cumulative += cf
            if cumulative >= request.initial_investment:
                excess = cumulative - request.initial_investment
                frac = 0.0 if cf == 0 else (1 - excess / cf)
                payback_period = t - (1 - frac)
                break

        profitability_index = pv_cash_flows / abs(request.initial_investment) if request.initial_investment != 0 else None

        if npv > 0 and irr is not None and irr > r:
            recommendation = "Accept: NPV positive and IRR exceeds discount rate."
        elif npv > 0:
            recommendation = "Consider: NPV positive but IRR is borderline."
        else:
            recommendation = "Reject: NPV negative."

        return CapitalBudgetOutput(
            project_name=request.project_name,
            currency=request.currency,
            npv=round(npv, 2),
            irr=round(irr * 100, 2) if irr is not None else None,
            payback_period=round(payback_period, 2) if payback_period is not None else None,
            profitability_index=round(profitability_index, 4) if profitability_index is not None else None,
            recommendation=recommendation,
        )

    def _approximate_irr(self, initial, cash_flows):
        # Basic IRR finder using binary search
        low, high = -0.9, 1.0
        for _ in range(100):
            mid = (low + high) / 2
            npv = -initial
            for t, cf in enumerate(cash_flows, 1):
                npv += cf / ((1 + mid) ** t)
            if abs(npv) < 1e-6:
                return mid
            if npv > 0:
                low = mid
            else:
                high = mid
        return (low + high) / 2
