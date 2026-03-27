from api.schemas import RegimeInput, RegimeOutput, RegimeDetail, SlabBreakdownItem, Verdict

class RegimeEngine:
    def compare(self, request: RegimeInput) -> RegimeOutput:
        # Standard deductions
        std_deduction_old = 50000.0
        std_deduction_new = 75000.0
        
        # --- Old Regime ---
        deductions_old = min(request.sec_80c, 150000.0) + min(request.sec_80d, 25000.0) + request.hra_exemption
        total_deduction_old = std_deduction_old + deductions_old
        taxable_income_old = max(0.0, request.gross_income - total_deduction_old)
        
        base_tax_old, old_slabs = self._calculate_old_tax(taxable_income_old)
        rebate_old = min(base_tax_old, 12500.0) if taxable_income_old <= 500000 else 0.0
        tax_after_rebate_old = base_tax_old - rebate_old
        cess_old = tax_after_rebate_old * 0.04
        total_tax_old = tax_after_rebate_old + cess_old
        
        old_regime_detail = RegimeDetail(
            taxable_income=taxable_income_old,
            total_deductions=total_deduction_old,
            slab_breakdown=old_slabs,
            base_tax=base_tax_old,
            cess=cess_old,
            rebate=rebate_old,
            total_tax=total_tax_old
        )
        
        # --- New Regime ---
        taxable_income_new = max(0.0, request.gross_income - std_deduction_new)
        
        base_tax_new, new_slabs = self._calculate_new_tax(taxable_income_new)
        rebate_new = min(base_tax_new, 25000.0) if taxable_income_new <= 700000 else 0.0
        tax_after_rebate_new = base_tax_new - rebate_new
        cess_new = tax_after_rebate_new * 0.04
        total_tax_new = tax_after_rebate_new + cess_new
        
        new_regime_detail = RegimeDetail(
            taxable_income=taxable_income_new,
            total_deductions=std_deduction_new,
            slab_breakdown=new_slabs,
            base_tax=base_tax_new,
            cess=cess_new,
            rebate=rebate_new,
            total_tax=total_tax_new
        )
        
        # --- Verdict ---
        tax_saving = abs(total_tax_old - total_tax_new)
        if total_tax_old < total_tax_new:
            rec = "Old Regime"
            base_t = total_tax_new if total_tax_new > 0 else 1.0
            pct = (tax_saving / base_t * 100) if base_t > 0 else 0.0
            reason = f"Old regime selected due to significant deductions (₹{deductions_old})"
        elif total_tax_new < total_tax_old:
            rec = "New Regime"
            base_t = total_tax_old if total_tax_old > 0 else 1.0
            pct = (tax_saving / base_t * 100) if base_t > 0 else 0.0
            reason = "New regime pays off better due to substantially lower baseline rates"
        else:
            rec = "Either Regime"
            pct = 0.0
            reason = "Tax liability is equal under both regimes"
            
        verdict = Verdict(
            recommended_regime=rec,
            tax_saving=tax_saving,
            saving_percentage=round(pct, 2),
            reason=reason
        )
        
        citations = [
            "Section 115BAC, Income Tax Act 2025",
            "Section 80C, Income Tax Act 2025",
            "Section 87A, Income Tax Act 2025"
        ]
        
        return RegimeOutput(
            old_regime=old_regime_detail,
            new_regime=new_regime_detail,
            verdict=verdict,
            citations=citations
        )

    def _calculate_old_tax(self, income: float):
        tax = 0.0
        slabs = []
        if income > 1000000:
            tax_in_slab = (income - 1000000) * 0.30
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="10,00,001 - above", rate="30%", tax=tax_in_slab))
            income = 1000000
        if income > 500000:
            tax_in_slab = (income - 500000) * 0.20
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="5,00,001 - 10,00,000", rate="20%", tax=tax_in_slab))
            income = 500000
        if income > 250000:
            tax_in_slab = (income - 250000) * 0.05
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="2,50,001 - 5,00,000", rate="5%", tax=tax_in_slab))
            income = 250000
        if income > 0:
            slabs.append(SlabBreakdownItem(slab="0 - 2,50,000", rate="0%", tax=0.0))
            
        slabs.reverse()
        return tax, slabs

    def _calculate_new_tax(self, income: float):
        tax = 0.0
        slabs = []
        if income > 1500000:
            tax_in_slab = (income - 1500000) * 0.30
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="15,00,001 - above", rate="30%", tax=tax_in_slab))
            income = 1500000
        if income > 1200000:
            tax_in_slab = (income - 1200000) * 0.20
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="12,00,001 - 15,00,000", rate="20%", tax=tax_in_slab))
            income = 1200000
        if income > 1000000:
            tax_in_slab = (income - 1000000) * 0.15
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="10,00,001 - 12,00,000", rate="15%", tax=tax_in_slab))
            income = 1000000
        if income > 700000:
            tax_in_slab = (income - 700000) * 0.10
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="7,00,001 - 10,00,000", rate="10%", tax=tax_in_slab))
            income = 700000
        if income > 300000:
            tax_in_slab = (income - 300000) * 0.05
            tax += tax_in_slab
            slabs.append(SlabBreakdownItem(slab="3,00,001 - 7,00,000", rate="5%", tax=tax_in_slab))
            income = 300000
        if income > 0:
            slabs.append(SlabBreakdownItem(slab="0 - 3,00,000", rate="0%", tax=0.0))
            
        slabs.reverse()
        return tax, slabs
