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
      T_digital_freeze = api_freeze_latency_sec / 60.0
      Success if api_available and (T_digital_freeze < delta_t_hat)
      Sets indicator:
        i_freeze = 1 if (api_available and t_digital_freeze_mins < delta_t_hat_mins) else 0
      
      Note: friction_delay_mins (tau_friction = +15.0m) represents targeted card-session 
      latency injection, EMV transaction micro-delays, and dynamic step-up authentication 
      at the banking switch (Sec 106 BNSS). This selectively isolates and rate-limits the 
      suspect mule card session while preserving 100% kiosk uptime for legitimate citizens.
      
    Condition 2 (Physical Patrol Intercept):
      T_physical_dispatch = cad_route_delay_mins + (pcr_distance_km / max(1.0, pcr_speed_kmh)) * 60.0
      Success if:
        T_physical_dispatch < delta_t_hat + (i_freeze * friction_delay_mins)
      
    Extended Interdiction Horizon:
      effective_window_mins = delta_t_hat + (i_freeze * friction_delay_mins)
      time_margin_mins = effective_window_mins - T_physical_dispatch
      
    4-State Outcome Matrix:
      - (i_freeze == 1, time_margin >= 0): OPTIMAL_INTERDICTION (Card locked + courier intercepted)
      - (i_freeze == 1, time_margin < 0) : ASSET_PRESERVED_ONLY (Funds preserved via card hold; courier fled)
      - (i_freeze == 0, time_margin >= 0): KINETIC_INTERCEPT (Physical cordon achieved before dispense)
      - (i_freeze == 0, time_margin < 0) : INTERDICTION_FAILED (Cashout occurred prior to arrival)
    """
    # 1. Condition 1: Digital Pre-emption (Card-Session Freeze)
    t_digital_freeze_mins = api_freeze_latency_sec / 60.0
    digital_freeze_success = bool(api_available and (t_digital_freeze_mins < delta_t_hat_mins))
    i_freeze = 1 if digital_freeze_success else 0

    # 2. Condition 2: Physical Patrol Intercept (CAD Dispatch)
    effective_speed = max(1.0, pcr_speed_kmh)
    t_physical_dispatch_mins = cad_route_delay_mins + (pcr_distance_km / effective_speed) * 60.0

    # 3. Extended Intercept Window & Operational Margin
    effective_window_mins = delta_t_hat_mins + (i_freeze * friction_delay_mins)
    time_margin_mins = effective_window_mins - t_physical_dispatch_mins

    # 4. 4-State Operational Outcome Classification
    if digital_freeze_success:
        if time_margin_mins >= 0:
            outcome = InterdictionOutcome.OPTIMAL_INTERDICTION
            operational_brief = (
                f"OPTIMAL INTERDICTION: Targeted card-session hold deployed (Sec 106 BNSS; kiosk remains available "
                f"for public) + physical patrol arrival with {time_margin_mins:.1f}m buffer. Capital preserved and courier intercepted."
            )
        else:
            outcome = InterdictionOutcome.ASSET_PRESERVED_ONLY
            operational_brief = (
                f"ASSET PRESERVED ONLY: Card-session debit hold active (Sec 106 BNSS); funds saved. Courier anticipated to flee "
                f"terminal prior to patrol arrival (deficit: {abs(time_margin_mins):.1f}m)."
            )
    else:
        if time_margin_mins >= 0:
            outcome = InterdictionOutcome.KINETIC_INTERCEPT
            operational_brief = (
                f"KINETIC INTERCEPT: Digital hold unconfirmed; PCR beat patrol achieves physical cordon "
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
        patrol_eta_mins=round(t_physical_dispatch_mins, 2),
        time_margin_mins=round(time_margin_mins, 2),
        operational_brief=operational_brief
    )
