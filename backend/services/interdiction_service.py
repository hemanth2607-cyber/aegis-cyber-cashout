"""
Sequential Interdiction Feasibility Engine
Evaluates two-condition sequential dependency model and 4-state operational outcome matrix
for cybercrime cashout interdiction combining digital pre-emption (Sec 106 BNSS) and physical CAD patrol dispatch.
"""
from enum import Enum
from dataclasses import dataclass, asdict
from typing import Dict, Any


class InterdictionOutcome(str, Enum):
    OPTIMAL_INTERDICTION = "OPTIMAL_INTERDICTION"        # Funds saved + suspect apprehended
    ASSET_PRESERVED_ONLY = "ASSET_PRESERVED_ONLY"        # Funds saved via digital freeze + suspect fled
    KINETIC_INTERCEPT = "KINETIC_INTERCEPT"              # Direct police capture without digital hold
    INTERDICTION_FAILED = "INTERDICTION_FAILED"          # Crime consummated before arrival


@dataclass
class InterdictionEvaluation:
    outcome: InterdictionOutcome
    digital_freeze_success: bool
    effective_window_mins: float
    patrol_eta_mins: float
    time_margin_mins: float
    operational_brief: str

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["outcome"] = self.outcome.value
        return d


def evaluate_interdiction_feasibility(
    delta_t_hat_mins: float,
    cad_route_delay_mins: float,
    pcr_distance_km: float,
    pcr_speed_kmh: float = 35.0,
    api_freeze_latency_sec: float = 1.5,
    friction_delay_mins: float = 15.0,
    api_available: bool = True
) -> InterdictionEvaluation:
    """
    Evaluates the formal sequential interdiction feasibility model:
    
    Condition 1 (Digital Pre-emption via Sec 106 BNSS):
      t_digital = api_freeze_latency_sec / 60.0
      Success if api_available and (t_digital < delta_t_hat_mins)
      Sets indicator i_freeze = 1 if success, else 0
      
    Condition 2 (Physical Patrol Intercept):
      t_physical = cad_route_delay_mins + (pcr_distance_km / max(1.0, pcr_speed_kmh)) * 60.0
      
    Extended Interdiction Horizon:
      effective_window_mins = delta_t_hat_mins + (i_freeze * friction_delay_mins)
      time_margin_mins = effective_window_mins - t_physical_mins
      
    4-State Outcome Matrix:
      - (i_freeze == 1, time_margin >= 0): OPTIMAL_INTERDICTION
      - (i_freeze == 1, time_margin < 0) : ASSET_PRESERVED_ONLY
      - (i_freeze == 0, time_margin >= 0): KINETIC_INTERCEPT
      - (i_freeze == 0, time_margin < 0) : INTERDICTION_FAILED
    """
    # 1. Condition 1: Digital Pre-emption
    t_digital_mins = api_freeze_latency_sec / 60.0
    digital_freeze_success = bool(api_available and (t_digital_mins < delta_t_hat_mins))
    i_freeze = 1 if digital_freeze_success else 0

    # 2. Condition 2: Physical Patrol Intercept
    effective_speed = max(1.0, pcr_speed_kmh)
    t_physical_mins = cad_route_delay_mins + (pcr_distance_km / effective_speed) * 60.0

    # 3. Effective Intercept Window & Time Margin
    effective_window_mins = delta_t_hat_mins + (i_freeze * friction_delay_mins)
    time_margin_mins = effective_window_mins - t_physical_mins

    # 4. 4-State Operational Outcome Classification
    if digital_freeze_success:
        if time_margin_mins >= 0:
            outcome = InterdictionOutcome.OPTIMAL_INTERDICTION
            operational_brief = (
                f"OPTIMAL INTERDICTION: Digital hold successful (Sec 106 BNSS) + physical patrol arrival "
                f"with {time_margin_mins:.1f}m buffer. Siphoned capital preserved and courier intercepted."
            )
        else:
            outcome = InterdictionOutcome.ASSET_PRESERVED_ONLY
            operational_brief = (
                f"ASSET PRESERVED ONLY: Account lien active (Sec 106 BNSS); funds saved. Courier anticipated to flee "
                f"prior to patrol arrival (deficit: {abs(time_margin_mins):.1f}m)."
            )
    else:
        if time_margin_mins >= 0:
            outcome = InterdictionOutcome.KINETIC_INTERCEPT
            operational_brief = (
                f"KINETIC INTERCEPT: Digital hold unavailable/late; PCR beat patrol achieves physical cordon "
                f"with {time_margin_mins:.1f}m margin prior to cash dispense."
            )
        else:
            outcome = InterdictionOutcome.INTERDICTION_FAILED
            operational_brief = (
                f"INTERDICTION FAILED: Cashout consummation projected before patrol arrival "
                f"(arrival deficit: {abs(time_margin_mins):.1f}m) with digital hold unconfirmed."
            )

    return InterdictionEvaluation(
        outcome=outcome,
        digital_freeze_success=digital_freeze_success,
        effective_window_mins=round(effective_window_mins, 2),
        patrol_eta_mins=round(t_physical_mins, 2),
        time_margin_mins=round(time_margin_mins, 2),
        operational_brief=operational_brief
    )
