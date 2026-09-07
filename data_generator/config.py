"""
Enterprise Cybercrime Synthetic Data Generator Configuration
Target Region: Delhi-NCR (I4C, 1930 NCRP, CFCFRMS, and Bank Switch Telemetry)
"""

# Bounding box coordinates for Delhi-NCR
LAT_MIN = 28.4000
LAT_MAX = 28.8800
LON_MIN = 76.8500
LON_MAX = 77.4500

# High-Risk / Evasive Highway Corridors for escape routing (NH-48, Outer Ring Road, Mehrauli-Gurgaon Rd, Noida Expressway)
HIGHWAY_CORRIDORS = [
    {"name": "NH-48_DELHI_GURUGRAM", "lat_start": 28.5300, "lon_start": 77.1000, "lat_end": 28.4200, "lon_end": 76.9900},
    {"name": "OUTER_RING_ROAD", "lat_start": 28.6200, "lon_start": 77.0800, "lat_end": 28.7100, "lon_end": 77.2200},
    {"name": "NOIDA_GREATER_NOIDA_EXPWY", "lat_start": 28.5400, "lon_start": 77.3400, "lat_end": 28.4600, "lon_end": 77.4300},
]

# Realistic Indian Banks and representative IFSC prefixes
BANKS = [
    "State Bank of India",
    "Punjab National Bank",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Canara Bank",
    "Bank of Baroda"
]

BANK_IFSC_MAP = {
    "State Bank of India": "SBIN",
    "Punjab National Bank": "PUNB",
    "HDFC Bank": "HDFC",
    "ICICI Bank": "ICIC",
    "Axis Bank": "UTIB",
    "Canara Bank": "CNRB",
    "Bank of Baroda": "BARB"
}

# Cyber Fraud Categories (1930 / I4C / NCRP)
FRAUD_CATEGORIES = [
    "INVESTMENT_SCAM",
    "DIGITAL_ARREST",
    "PART_TIME_JOB_FRAUD",
    "LOAN_APP_EXTORTION",
    "CUSTOMER_CARE_IMPERSONATION"
]

# Terminal Types for Physical Cash Out
TERMINAL_TYPES = [
    "ATM_ONSITE",
    "ATM_OFFSITE",
    "CSP_BANK_MITRA",
    "AEPS_MERCHANT"
]

# Payment rails in Indian Financial Switch
PAYMENT_MODES = ["UPI", "IMPS", "NEFT", "RTGS", "AEPS"]

# KYC Risk Tier Levels
KYC_RISK_LEVELS = ["LOW", "MEDIUM", "CRITICAL"]
