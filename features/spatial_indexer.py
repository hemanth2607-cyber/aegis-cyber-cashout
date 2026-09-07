"""
Spatial Enrichment & Geospatial H3 Indexing Engine
Maps terminals, spatial hexagons (H3 Res 7, 8, 9), and metric KDTree spatial lookups for Delhi-NCR.
"""

import os
import math
from typing import Dict, List, Tuple, Optional
import numpy as np
import pandas as pd
import h3
from scipy.spatial import cKDTree

from data_generator.config import HIGHWAY_CORRIDORS

# Key Police Stations & Cyber Crime Cells in Delhi-NCR
DELHI_NCR_POLICE_STATIONS = [
    {"name": "Delhi Police Cyber Cell (Mandir Marg)", "lat": 28.6315, "lon": 77.2005},
    {"name": "Gurugram Cyber Crime PS (Sector 43)", "lat": 28.4595, "lon": 77.0725},
    {"name": "Noida Cyber Crime PS (Sector 36)", "lat": 28.5720, "lon": 77.3450},
    {"name": "Rohini Cyber Police Station", "lat": 28.7280, "lon": 77.1210},
    {"name": "Dwarka Cyber PS (South West)", "lat": 28.5920, "lon": 77.0460},
    {"name": "Central District Cyber PS (Daryaganj)", "lat": 28.6470, "lon": 77.2410},
    {"name": "Faridabad Cyber PS (NIT)", "lat": 28.3980, "lon": 77.3010}
]

class SpatialEnricher:
    """
    High-performance spatial enrichment engine utilizing Uber H3 and SciPy cKDTree
    for rapid terminal indexing, density calculation, and critical infrastructure proximity.
    """
    def __init__(self, terminals_path: Optional[str] = None):
        if terminals_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            terminals_path = os.path.join(base_dir, "data_generator", "terminals.parquet")

        self.terminals_path = terminals_path
        self.terminals_df = pd.DataFrame()
        self.kdtree = None
        self.terminal_coords_cartesian = None
        self.police_kdtree = None

        self._load_terminals()
        self._build_police_index()

    @staticmethod
    def latlon_to_cartesian_meters(lat: float, lon: float) -> Tuple[float, float]:
        """
        Converts WGS84 (Lat/Lon) to local Cartesian projection (UTM Zone 43N metric approximation)
        centered at 28.5°N, 77.0°E in meters.
        """
        r_lat = math.radians(lat)
        x = (lon - 77.0) * 111320.0 * math.cos(r_lat)
        y = (lat - 28.0) * 110574.0
        return float(x), float(y)

    @classmethod
    def latlng_to_h3_indices(cls, lat: float, lon: float) -> Dict[str, str]:
        """Computes Uber H3 indices at resolutions 7, 8, and 9"""
        return {
            "h3_res7": h3.latlng_to_cell(lat, lon, 7),
            "h3_res8": h3.latlng_to_cell(lat, lon, 8),
            "h3_res9": h3.latlng_to_cell(lat, lon, 9),
        }

    def _load_terminals(self):
        if not os.path.exists(self.terminals_path):
            print(f"[!] Warning: Terminals file not found at {self.terminals_path}")
            return

        self.terminals_df = pd.read_parquet(self.terminals_path)
        
        # Pre-index terminals by H3 cell for O(1) instantaneous lookup
        self.terminals_by_h3 = {}
        for _, row in self.terminals_df.iterrows():
            h8 = row.get("h3_res8")
            if h8:
                if h8 not in self.terminals_by_h3:
                    self.terminals_by_h3[h8] = []
                self.terminals_by_h3[h8].append(row.to_dict())

        # Project all terminals to Cartesian meters for cKDTree
        cartesian_pts = [
            self.latlon_to_cartesian_meters(row["lat"], row["lon"])
            for _, row in self.terminals_df.iterrows()
        ]
        self.terminal_coords_cartesian = np.array(cartesian_pts)
        self.kdtree = cKDTree(self.terminal_coords_cartesian)
        print(f"[+] Loaded {len(self.terminals_df)} terminals into spatial cKDTree and H3 hash index.")

    def _build_police_index(self):
        pts = [
            self.latlon_to_cartesian_meters(p["lat"], p["lon"])
            for p in DELHI_NCR_POLICE_STATIONS
        ]
        self.police_kdtree = cKDTree(np.array(pts))

    def _min_dist_to_highway_meters(self, lat: float, lon: float) -> float:
        """Computes minimum distance in meters from point to designated highway corridors"""
        min_dist_km = float('inf')
        for corr in HIGHWAY_CORRIDORS:
            # Segment AB
            a_lat, a_lon = corr["lat_start"], corr["lon_start"]
            b_lat, b_lon = corr["lat_end"], corr["lon_end"]

            dx = (b_lon - a_lon) * 111.0 * math.cos(math.radians((a_lat + b_lat) / 2))
            dy = (b_lat - a_lat) * 111.0
            seg_sq = dx * dx + dy * dy

            if seg_sq == 0:
                d = math.sqrt(((lat - a_lat) * 111.0)**2 + ((lon - a_lon) * 111.0 * math.cos(math.radians(lat)))**2)
            else:
                px = (lon - a_lon) * 111.0 * math.cos(math.radians(lat))
                py = (lat - a_lat) * 111.0
                t = max(0.0, min(1.0, (px * dx + py * dy) / seg_sq))
                proj_x = a_lon + t * (b_lon - a_lon)
                proj_y = a_lat + t * (b_lat - a_lat)
                d = math.sqrt(((lat - proj_y) * 111.0)**2 + ((lon - proj_x) * 111.0 * math.cos(math.radians(lat)))**2)

            if d < min_dist_km:
                min_dist_km = d

        return float(min_dist_km * 1000.0)

    def get_h3_spatial_features(self, h3_index: str) -> Dict[str, Any]:
        """
        Calculates cell-level features for a given H3 hexagon:
        - atm_density: Total ATMs inside the hexagon
        - csp_density: Total Bank Mitras inside the hexagon
        - avg_liquidity: Mean cash reserves of terminals in the cell
        - cctv_coverage_ratio: Proportion of terminals with active surveillance
        - min_distance_to_police: Distance from centroid to nearest police station (meters)
        - min_distance_to_highway: Distance from centroid to nearest major corridor (meters)
        """
        # Obtain cell centroid coordinates
        cell_lat, cell_lon = h3.cell_to_latlng(h3_index)

        # O(1) Instantaneous Hash Lookup
        matching_terminals = getattr(self, "terminals_by_h3", {}).get(h3_index, [])

        total_terminals = len(matching_terminals)
        if total_terminals > 0:
            atms_count = sum(1 for t in matching_terminals if "ATM" in str(t.get("terminal_type", "")))
            csps_count = sum(1 for t in matching_terminals if ("CSP" in str(t.get("terminal_type", "")) or "AEPS" in str(t.get("terminal_type", ""))))
            avg_liquidity = float(sum(t.get("current_cash_liquidity", 0.0) for t in matching_terminals) / total_terminals)
            cctv_active_count = sum(1 for t in matching_terminals if t.get("cctv_active", 0))
            cctv_ratio = float(cctv_active_count / total_terminals)
        else:
            atms_count = 0
            csps_count = 0
            avg_liquidity = 0.0
            cctv_ratio = 0.0

        # Distance from centroid to nearest police station (meters)
        centroid_cartesian = np.array(self.latlon_to_cartesian_meters(cell_lat, cell_lon))
        if self.police_kdtree is not None:
            dist_police, _ = self.police_kdtree.query(centroid_cartesian)
            min_dist_police = float(dist_police)
        else:
            min_dist_police = 2500.0

        # Distance from centroid to nearest highway (meters)
        min_dist_highway = self._min_dist_to_highway_meters(cell_lat, cell_lon)

        return {
            "h3_index": h3_index,
            "centroid_lat": round(cell_lat, 6),
            "centroid_lon": round(cell_lon, 6),
            "atm_density": atms_count,
            "csp_density": csps_count,
            "total_terminals": total_terminals,
            "avg_liquidity": round(avg_liquidity, 2),
            "cctv_coverage_ratio": round(cctv_ratio, 4),
            "min_distance_to_police": round(min_dist_police, 1),
            "min_distance_to_highway": round(min_dist_highway, 1)
        }

    def get_terminals_in_cell(self, h3_index: str) -> List[Dict[str, Any]]:
        """Returns list of all terminals situated inside the specified H3 hexagon"""
        return getattr(self, "terminals_by_h3", {}).get(h3_index, [])

    def query_nearest_terminals(self, lat: float, lon: float, k: int = 5) -> List[Dict[str, Any]]:
        """Queries the k nearest terminals to a geographic coordinate using cKDTree"""
        if self.kdtree is None:
            return []

        pt = np.array(self.latlon_to_cartesian_meters(lat, lon))
        distances, indices = self.kdtree.query(pt, k=min(k, len(self.terminals_df)))

        results = []
        if np.isscalar(indices):
            distances, indices = [distances], [indices]

        for dist_m, idx in zip(distances, indices):
            t_row = self.terminals_df.iloc[idx].to_dict()
            t_row["distance_meters"] = round(float(dist_m), 1)
            results.append(t_row)

        return results
