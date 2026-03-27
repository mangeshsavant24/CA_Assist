import json
from api.schemas import ForexValuationInput, ForexValuationOutput, ForexExposureResult
from langchain_core.messages import SystemMessage, HumanMessage

class ForexEngine:
    def evaluate_valuation(self, input_data: ForexValuationInput) -> ForexValuationOutput:
        results = []
        total_initial_value = 0.0
        total_current_value = 0.0
        net_gain_loss = 0.0
        
        for exp in input_data.exposures:
            initial_base_value = exp.foreign_amount * exp.initial_rate
            current_base_value = exp.foreign_amount * exp.current_rate
            
            if exp.exposure_type == 'Receivable':
                gain_loss = current_base_value - initial_base_value
            elif exp.exposure_type == 'Payable':
                gain_loss = initial_base_value - current_base_value
            else:
                gain_loss = 0.0
                
            status = 'Neutral'
            if gain_loss > 0:
                status = 'Gain'
            elif gain_loss < 0:
                status = 'Loss'
                
            total_initial_value += initial_base_value
            total_current_value += current_base_value
            net_gain_loss += gain_loss
            
            # Format and append
            results.append(ForexExposureResult(
                id=exp.id,
                currency_pair=exp.currency_pair,
                exposure_type=exp.exposure_type,
                foreign_amount=exp.foreign_amount,
                initial_base_value=initial_base_value,
                current_base_value=current_base_value,
                gain_loss=gain_loss,
                status=status,
                description=exp.description
            ))
            
        recommendation = ""
        if net_gain_loss > 0:
            recommendation = (f"The portfolio shows a net unrealized Forex Gain of {net_gain_loss:,.2f} {input_data.base_currency}. "
                              "This will increase reported profit, but is subject to taxation depending on local accounting standards (e.g., AS-11/Ind AS 21).")
        elif net_gain_loss < 0:
            recommendation = (f"The portfolio shows a net unrealized Forex Loss of {abs(net_gain_loss):,.2f} {input_data.base_currency}. "
                              "Consider hedging strategies such as forward contracts or options for volatile currency pairs to mitigate further downside risk.")
        else:
            recommendation = "The portfolio is perfectly hedged or has no net movement in currency valuations."
            
        return ForexValuationOutput(
            valuation_date=input_data.valuation_date,
            base_currency=input_data.base_currency,
            total_initial_value=total_initial_value,
            total_current_value=total_current_value,
            net_gain_loss=net_gain_loss,
            results=results,
            recommendation=recommendation
        )
