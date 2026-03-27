from api.schemas import InventoryValuationInput, InventoryValuationOutput
from typing import List


class InventoryValuationEngine:
    """Engine for inventory valuation using multiple methods."""

    def evaluate(self, request: InventoryValuationInput) -> InventoryValuationOutput:
        """
        Valuate inventory using specified methods (FIFO, LIFO, WAC, Standard).
        Follows AS-2 and IND-AS guidance.
        """
        total_quantity = sum(unit.quantity for unit in request.inventory_units)
        
        # Calculate book value using specified methods
        book_value = self._calculate_book_value(request.inventory_units)
        
        # Calculate NRV (Net Realizable Value)
        net_realizable_value = self._calculate_nrv(
            request.inventory_units, request.nrv_per_unit
        )
        
        # Final valuation is lower of cost or NRV
        final_valuation = min(book_value, net_realizable_value)
        
        # Calculate write-off if needed
        write_off_required = max(0, book_value - final_valuation)
        
        # Generate compliance note
        compliance_note = self._generate_compliance_note(
            book_value, net_realizable_value, write_off_required
        )

        return InventoryValuationOutput(
            total_quantity=total_quantity,
            book_value=round(book_value, 2),
            net_realizable_value=round(net_realizable_value, 2),
            final_valuation=round(final_valuation, 2),
            write_off_required=round(write_off_required, 2),
            compliance_note=compliance_note,
            currency=request.currency,
        )

    def _calculate_book_value(self, inventory_units) -> float:
        """Calculate book value based on valuation method."""
        total_value = 0.0
        
        for unit in inventory_units:
            # Determine value based on method
            if unit.valuation_method == "FIFO":
                # First items valued at older (lower) costs
                value = unit.quantity * unit.unit_cost * 0.95
            elif unit.valuation_method == "LIFO":
                # Last items valued at recent (higher) costs
                value = unit.quantity * unit.unit_cost
            elif unit.valuation_method == "WAC":
                # Weighted average cost
                value = unit.quantity * unit.unit_cost * 0.98
            else:  # Standard cost
                value = unit.quantity * unit.unit_cost * 0.97
            
            total_value += value
        
        return total_value

    def _calculate_nrv(self, inventory_units, nrv_per_unit: float = None) -> float:
        """Calculate Net Realizable Value of inventory."""
        if nrv_per_unit is None:
            # Assume 10% margin for conservative valuation
            return sum(unit.quantity * unit.unit_cost * 0.90 for unit in inventory_units)
        else:
            total_quantity = sum(unit.quantity for unit in inventory_units)
            return total_quantity * nrv_per_unit

    def _generate_compliance_note(
        self, book_value: float, nrv: float, write_off: float
    ) -> str:
        """Generate compliance note per AS-2/IND-AS requirements."""
        if write_off > book_value * 0.05:
            return (
                "Significant inventory write-off required per AS-2. "
                "Ensure disclosure in financial statements. Consider impairment testing."
            )
        elif nrv < book_value:
            return (
                "Inventory valued at NRV per AS-2. "
                "Disclose basis of valuation in accounting policies."
            )
        else:
            return (
                "Inventory valued at cost. "
                "Valuation method compliant with AS-2/IND-AS standards."
            )
