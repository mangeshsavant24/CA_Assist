from typing import List, Dict
from api.schemas import FundTransaction, FundInput, FundOutput, NAVDetail


class FundAccountingEngine:
    def calculate_fund_nav(self, request: FundInput) -> FundOutput:
        """
        Calculate NAV (Net Asset Value) and fund performance metrics.
        NAV = (Total Assets - Total Liabilities) / Number of Outstanding Units
        """
        
        fund_name = request.fund_name
        fund_type = request.fund_type
        opening_balance = request.opening_balance
        share_classes = request.share_classes or 1
        
        # Process transactions
        total_contributions = sum(t.amount for t in request.transactions if t.transaction_type == "contribution")
        total_withdrawals = sum(t.amount for t in request.transactions if t.transaction_type == "withdrawal")
        total_returns = sum(t.amount for t in request.transactions if t.transaction_type == "return")
        
        # Calculate fund value
        fund_value = (
            opening_balance 
            + total_contributions 
            - total_withdrawals 
            + total_returns
        )
        
        # NAV per unit
        nav_per_unit = fund_value / share_classes if share_classes > 0 else 0
        
        # Return on investment
        net_flow = total_contributions - total_withdrawals
        roi = 0.0
        if opening_balance + net_flow > 0:
            roi = (total_returns / (opening_balance + net_flow)) * 100
        
        # Build ledger
        ledger = self._build_ledger(
            opening_balance, 
            request.transactions, 
            fund_value
        )
        
        nav_detail = NAVDetail(
            fund_name=fund_name,
            fund_type=fund_type,
            opening_balance=opening_balance,
            total_contributions=total_contributions,
            total_withdrawals=total_withdrawals,
            total_returns=total_returns,
            closing_balance=fund_value,
            share_classes=share_classes,
            nav_per_unit=round(nav_per_unit, 2),
            roi_percentage=round(roi, 2),
            transaction_count=len(request.transactions),
            ledger_entries=ledger,
        )
        
        # Recommendation
        recommendation = self._get_recommendation(roi, fund_value)
        
        return FundOutput(
            nav_detail=nav_detail,
            recommendation=recommendation,
            currency=request.currency or "INR",
        )
    
    def _build_ledger(self, opening: float, transactions: List[FundTransaction], closing: float) -> List[Dict]:
        """Build running balance ledger."""
        ledger = []
        current_balance = opening
        
        # Opening entry
        ledger.append({
            "date": "Opening",
            "transaction_type": "opening",
            "amount": opening,
            "balance": current_balance,
        })
        
        # Process each transaction
        for txn in transactions:
            if txn.transaction_type == "contribution":
                current_balance += txn.amount
            elif txn.transaction_type == "withdrawal":
                current_balance -= txn.amount
            elif txn.transaction_type == "return":
                current_balance += txn.amount
            
            ledger.append({
                "date": txn.date or f"Txn {len(ledger)}",
                "transaction_type": txn.transaction_type,
                "description": txn.description or "",
                "amount": txn.amount,
                "balance": round(current_balance, 2),
            })
        
        return ledger
    
    def _get_recommendation(self, roi: float, fund_value: float) -> str:
        if roi > 15:
            return f"Excellent performance: {roi:.2f}% ROI. Fund growing well. Consider increasing allocation."
        elif roi > 8:
            return f"Good performance: {roi:.2f}% ROI. Fund meeting expectations. Maintain current strategy."
        elif roi > 0:
            return f"Positive performance: {roi:.2f}% ROI. Fund generating returns. Review expense ratios."
        elif roi == 0:
            return "Fund at breakeven. Monitor closely; consider rebalancing."
        else:
            return f"Negative performance: {roi:.2f}% ROI. Review fund allocation and strategy."
