from api.schemas import ForexValuationInput, ForexValuationOutput


class ForexValuationEngine:
    """Engine for foreign exchange valuation and treatment analysis."""

    def evaluate(self, request: ForexValuationInput) -> ForexValuationOutput:
        """
        Valuate forex exposure using specified method.
        Supports Current Rate, Covering Rate, and Average Rate methods.
        """
        # Calculate total exposure in INR
        total_exposure_inr = sum(exp.amount for exp in request.exposures)

        # Calculate forex gain/loss (simplified)
        forex_gain_loss = self._calculate_forex_impact(request.exposures)

        # Determine tax treatment
        treatment = self._determine_tax_treatment(
            request.valuation_method, forex_gain_loss
        )

        # Generate recommendation
        recommendation = self._generate_recommendation(
            forex_gain_loss, treatment, request.valuation_method
        )

        return ForexValuationOutput(
            exposure_date=request.exposure_date,
            total_exposure_inr=round(total_exposure_inr, 2),
            valuation_method=request.valuation_method,
            forex_gain_loss=round(forex_gain_loss, 2),
            treatment=treatment,
            recommendation=recommendation,
            currency=request.currency,
        )

    def _calculate_forex_impact(self, exposures) -> float:
        """Calculate realized/unrealized forex gain or loss."""
        impact = 0.0
        for exp in exposures:
            if exp.transaction_rate:
                # Simplified: difference between amounts
                impact += exp.amount * 0.02  # Assume 2% fluctuation
        return impact

    def _determine_tax_treatment(self, method: str, gain_loss: float) -> str:
        """Determine tax treatment based on method and amount."""
        if gain_loss > 0:
            if method == "Current Rate":
                return "Taxable as capital gain (Section 45)"
            elif method == "Covering Rate":
                return "Taxable under business income"
            else:
                return "Taxable under relevant income head"
        else:
            return "Loss allowable under relevant section"

    def _generate_recommendation(self, gain_loss: float, treatment: str, method: str) -> str:
        """Generate recommendation for forex management."""
        if abs(gain_loss) < 100000:
            return (
                f"Exposure is modest ({treatment}). "
                "Consider hedging if exposure increases significantly."
            )
        elif gain_loss > 0:
            return (
                f"Significant {treatment}. "
                "Recommend documenting hedging strategies and maintaining transfer pricing compliance."
            )
        else:
            return (
                f"Loss recognized ({treatment}). "
                "Maintain documentation for CIT exemptions if applicable under Section 118."
            )
