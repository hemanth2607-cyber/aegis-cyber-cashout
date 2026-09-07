"""
Pydantic v2 Data Transfer Objects & Schemas for Cybercrime Forecaster Backend
Supports both standard API schemas and legacy test hooks.
"""
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import time
from pydantic import BaseModel, Field, ConfigDict


class ComplaintIngestRequest(BaseModel):
    complaint_id: str = Field(description="Unique NCRP 1930 / I4C complaint identifier")
    victim_account: str = Field(description="Victim's compromised primary account")
    victim_bank: str = Field(description="Bank name of victim")
    initial_amount: float = Field(gt=0, description="Amount siphoned from victim account")
    fraud_category: str = Field(description="Category of fraud (e.g. DIGITAL_ARREST, INVESTMENT_SCAM)")
    initial_utr: str = Field(description="First hop transaction reference number")
    victim_lat: float = Field(description="Latitude of victim location")
    victim_lon: float = Field(description="Longitude of victim location")
    timestamp: Union[float, str, datetime] = Field(
        default_factory=lambda: time.time(),
        description="Timestamp of complaint ingestion"
    )

    model_config = ConfigDict(extra="allow", populate_by_name=True)


class TransactionHookRequest(BaseModel):
    utr: str = Field(description="Unique Transaction Reference")
    complaint_id: Optional[str] = Field(default=None, description="Linked complaint ID if known")
    sender_account: str = Field(alias="sender", description="Debited account number")
    receiver_account: str = Field(alias="receiver", description="Credited mule account number")
    amount: float = Field(gt=0, description="Transaction amount transferred")
    payment_channel: str = Field(default="IMPS", alias="chan", description="Payment rail (IMPS, UPI, NEFT, RTGS)")
    timestamp: Union[float, str, datetime] = Field(
        default_factory=lambda: time.time(),
        description="Timestamp of transaction execution"
    )

    model_config = ConfigDict(extra="allow", populate_by_name=True)


class TerminalInfo(BaseModel):
    terminal_id: str
    bank: str = Field(default="State Bank of India", alias="bank_name")
    lat: float
    lon: float
    address: str = "Delhi-NCR Sector"
    current_cash: float = Field(default=250000.0, alias="current_cash_liquidity")

    model_config = ConfigDict(extra="allow", populate_by_name=True)


class TacticalFactor(BaseModel):
    feature: str
    shap_value: float
    description: str


class TacticalExplanation(BaseModel):
    predicted_minutes: float
    predicted_confidence: float
    top_factors: List[TacticalFactor] = []
    legal_brief: str = ""

    model_config = ConfigDict(extra="allow")


class TargetCellInfo(BaseModel):
    h3_res8: str
    lat: float
    lon: float
    probability: Optional[float] = None
    candidate_terminals: List[TerminalInfo] = []

    model_config = ConfigDict(extra="allow")


class PredictionResponse(BaseModel):
    complaint_id: str
    predicted_cashout_time: str
    window_minutes: float
    predicted_cashout_window_mins: Optional[float] = None
    confidence_score: float
    target_h3_res8: str
    target_h3_res9: Optional[str] = None
    candidate_atms: List[TerminalInfo] = []
    tactical_explanation: Dict[str, Any]
    primary_target_cell: Optional[Dict[str, Any]] = None
    top_3_spatial_clusters: Optional[List[Dict[str, Any]]] = None
    tactical_advisory: Optional[str] = None
    interdiction_outcome: Optional[str] = None
    effective_window_mins: Optional[float] = None
    patrol_eta_mins: Optional[float] = None
    time_margin_mins: Optional[float] = None

    model_config = ConfigDict(extra="allow")


class DispatchCADRequest(BaseModel):
    complaint_id: str
    target_h3_index: str
    assigned_patrol_unit_id: Optional[str] = None
    priority: str = Field(default="HIGH", description="Priority level: HIGH or CRITICAL")
    delta_t_hat_mins: Optional[float] = Field(default=18.5, description="Estimated cashout window")
    pcr_distance_km: Optional[float] = Field(default=2.8, description="Distance from assigned PCR to target terminal")
    pcr_speed_kmh: Optional[float] = Field(default=35.0, description="PCR unit transit speed")

    model_config = ConfigDict(extra="allow")


class DispatchCADResponse(BaseModel):
    dispatch_id: str
    patrol_car: str
    eta_minutes: float
    status: str = "DISPATCHED"
    complaint_id: Optional[str] = None
    target_h3: Optional[str] = None
    interdiction_outcome: Optional[str] = None
    effective_window_mins: Optional[float] = None
    patrol_eta_mins: Optional[float] = None
    time_margin_mins: Optional[float] = None
    operational_brief: Optional[str] = None
    statutory_power: Optional[str] = "SECTION_106_BNSS"


class BankFrictionRequest(BaseModel):
    complaint_id: str
    target_mule_account: str
    action: str = Field(
        default="STEP_UP_AUTH",
        description="Friction type: STEP_UP_AUTH, TERMINAL_CASH_LIMIT, CARD_FREEZE"
    )
    friction_mode: str = Field(
        default="CARD_SESSION_HOLD",
        description="Friction mode: CARD_SESSION_HOLD, DYNAMIC_STEP_UP_AUTH, DAILY_LIMIT_ZERO"
    )
    statutory_power: str = "SECTION_106_BNSS"

    model_config = ConfigDict(extra="allow")


class BankFrictionResponse(BaseModel):
    transaction_freeze_status: str = "SUCCESS"
    action_taken: str
    risk_reference: str
    target_mule_account: Optional[str] = None
    statutory_power: str = "SECTION_106_BNSS"
    statutory_brief: str = "Immediate targeted card-session debit lien and rate limiting enacted under Section 106 BNSS (kiosk remains active for public)."
    kiosk_public_availability: str = "ACTIVE_FOR_PUBLIC"
    penal_code_sections: List[str] = [
        "Section 318(4) BNS",
        "Section 319 BNS",
        "Section 66D IT Act"
    ]
