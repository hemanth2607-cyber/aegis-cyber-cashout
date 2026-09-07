export interface Terminal {
  terminal_id: string;
  bank: string;
  lat: float;
  lon: float;
  address: string;
  current_cash: number;
}

export type float = number;

export interface TargetCell {
  h3_res8: string;
  lat: number;
  lon: number;
  probability?: number;
  candidate_terminals?: Terminal[];
}

export interface TacticalFactor {
  feature: string;
  shap_value: number;
  description: string;
}

export interface TacticalExplanation {
  predicted_minutes?: number;
  predicted_confidence?: number;
  top_factors?: TacticalFactor[];
  legal_brief?: string;
  bnss_section_106_warrant?: string;
  bnss_section_107_attachment?: string;
  statutory_power?: string;
  procedural_sections?: string[];
  substantive_sections?: string[];
  statutory_compliance?: {
    bnss_section_106_warrant?: string;
    bnss_section_107_attachment?: string;
    statutory_power?: string;
    procedural_sections?: string[];
    substantive_sections?: string[];
  };
}

export interface GraphNode {
  account: string;
  type: "VICTIM" | "MULE";
  lat: number;
  lon: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  amount: number;
  channel: string;
  utr: string;
  timestamp: number;
}

export interface GraphTrace {
  complaint_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Prediction {
  complaint_id: string;
  predicted_cashout_time: string;
  window_minutes: number;
  predicted_cashout_window_mins?: number;
  confidence_score: number;
  target_h3_res8: string;
  target_h3_res9?: string;
  candidate_atms: Terminal[];
  tactical_explanation: TacticalExplanation;
  primary_target_cell?: TargetCell;
  top_3_spatial_clusters?: TargetCell[];
  tactical_advisory?: string;
  countdown_seconds?: number;
  remaining_window_minutes?: number;
  graph_trace?: GraphTrace;
  initial_amount?: number;
  peeled_amount?: number;
  victim_bank?: string;
  fraud_category?: string;
  interdiction_outcome?: string;
  effective_window_mins?: number;
  patrol_eta_mins?: number;
  time_margin_mins?: number;
}

export interface CADDispatch {
  dispatch_id: string;
  patrol_car: string;
  eta_minutes: number;
  status: string;
  complaint_id?: string;
  target_h3?: string;
  timestamp?: number;
  interdiction_outcome?: string;
  effective_window_mins?: number;
  patrol_eta_mins?: number;
  time_margin_mins?: number;
  operational_brief?: string;
  statutory_power?: string;
}

export interface BankFriction {
  transaction_freeze_status: string;
  action_taken: string;
  risk_reference: string;
  target_mule_account?: string;
  complaint_id?: string;
  timestamp?: number;
  friction_mode?: string;
  statutory_power?: string;
  statutory_brief?: string;
  kiosk_public_availability?: string;
  penal_code_sections?: string[];
}

export interface BeatUnit {
  unit_id: string;
  callsign: string;
  lat: number;
  lon: number;
  status: "PATROLLING" | "DISPATCHED" | "STANDBY";
  buffer_radius_km: number;
}
