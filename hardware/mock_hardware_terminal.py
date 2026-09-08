#!/usr/bin/env python3
"""
AegisCashout: Mock Physical Hardware Terminal Emulator
Hardware-In-The-Loop (HITL) ATM Lock Beacon Simulator for Presentation Environments.

Simulates an ESP32 / Arduino microcontroller connected via WebSocket:
- Displays physical GPIO pin logic states (LED Strobe, Siren PWM, Solenoid Relay).
- Flashes high-visibility ANSI red/amber strobe banners upon Section 106 BNSS triggers.
- Reconnects automatically to ws://127.0.0.1:8000/ws/hardware/beacon.
"""
import sys
import os
import time
import json
import asyncio
from datetime import datetime

# Windows ANSI terminal escape support
if os.name == 'nt':
    os.system('')

# ANSI Colors & Formatting
CLR_RESET   = "\033[0m"
CLR_BOLD    = "\033[1m"
CLR_DIM     = "\033[2m"
CLR_RED     = "\033[91m"
CLR_GREEN   = "\033[92m"
CLR_YELLOW  = "\033[93m"
CLR_BLUE    = "\033[94m"
CLR_MAGENTA = "\033[95m"
CLR_CYAN    = "\033[96m"
CLR_WHITE   = "\033[97m"
BG_RED      = "\033[41m"
BG_GREEN    = "\033[42m"
BG_BLACK    = "\033[40m"
BG_CYAN     = "\033[46m"


def clear_screen():
    print("\033[2J\033[H", end="")


class MockHardwareBeacon:
    def __init__(self, ws_url: str = "ws://127.0.0.1:8000/ws/hardware/beacon"):
        self.ws_url = ws_url
        self.is_connected = False
        self.is_alarm_active = False
        self.alarm_start_time = 0.0
        self.alarm_duration_s = 15.0
        self.buzzer_freq = 2400
        self.terminal_id = "ATM-DL-9082"
        self.target_account = "YESB00010921"
        self.statutory_power = "SECTION_106_BNSS"
        self.total_triggers = 0
        self.strobe_tick = 0

    def render_display(self):
        clear_screen()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Header
        print(f"{CLR_CYAN}{CLR_BOLD}╔════════════════════════════════════════════════════════════════════════════════╗{CLR_RESET}")
        print(f"{CLR_CYAN}{CLR_BOLD}║   AEGIS-CASHOUT // HARDWARE-IN-THE-LOOP (HITL) PHYSICAL BEACON EMULATOR        ║{CLR_RESET}")
        print(f"{CLR_CYAN}{CLR_BOLD}║   Microcontroller: ESP32-WROOM-32 (Simulated) | Link: {self.ws_url:<24} ║{CLR_RESET}")
        print(f"{CLR_CYAN}{CLR_BOLD}╚════════════════════════════════════════════════════════════════════════════════╝{CLR_RESET}")

        # Connection & Telemetry Status
        conn_badge = f"{BG_GREEN}{CLR_WHITE}{CLR_BOLD} WS LINK: ONLINE {CLR_RESET}" if self.is_connected else f"{BG_RED}{CLR_WHITE}{CLR_BOLD} WS LINK: DISCONNECTED {CLR_RESET}"
        print(f"\n {conn_badge}  {CLR_DIM}Local Clock:{CLR_RESET} {now_str}  |  {CLR_DIM}Total Triggers:{CLR_RESET} {self.total_triggers}")

        # ASCII Art Diagram of ESP32 Hardware Module
        print(f"\n{CLR_WHITE}{CLR_BOLD} [PHYSICAL HARDWARE TESTBENCH TOPOLOGY]{CLR_RESET}")
        print(f"{CLR_DIM} ┌────────────────── ESP32-WROOM-32 MICROCONTROLLER ──────────────────┐{CLR_RESET}")
        print(f"{CLR_DIM} │                                                                     │{CLR_RESET}")

        if self.is_alarm_active:
            # Alarm Active State
            pulse_on = (self.strobe_tick % 2 == 0)
            strobe_col = f"{BG_RED}{CLR_WHITE}{CLR_BOLD}" if pulse_on else f"{CLR_RED}{CLR_BOLD}"
            siren_col = f"{CLR_YELLOW}{CLR_BOLD}"

            print(f" │  GPIO 22 [RED STROBE]   ──▶ {strobe_col}[ ⚡ ACTIVE 7.7Hz STROBE PULSE ]{CLR_RESET}{CLR_DIM}              │{CLR_RESET}")
            print(f" │  GPIO 23 [PIEZO BUZZER] ──▶ {siren_col}[ ♫ 110dB WARBLE SIREN ({self.buzzer_freq} Hz) ]{CLR_RESET}{CLR_DIM}       │{CLR_RESET}")
            print(f" │  GPIO 21 [SOLENOID RELAY] ─▶ {CLR_RED}{CLR_BOLD}[ 🔒 DISPENSER SHUTTER LOCKED ]{CLR_RESET}{CLR_DIM}             │{CLR_RESET}")
            print(f" │  GPIO 19 [GREEN STATUS] ──▶ {CLR_GREEN}{CLR_BOLD}[ ● STEADY ON - PUBLIC KIOSK ACTIVE ]{CLR_RESET}{CLR_DIM}       │{CLR_RESET}")
        else:
            # Standby State
            print(f" │  GPIO 22 [RED STROBE]   ──▶ {CLR_DIM}[ OFF / STANDBY ]{CLR_RESET}{CLR_DIM}                                  │{CLR_RESET}")
            print(f" │  GPIO 23 [PIEZO BUZZER] ──▶ {CLR_DIM}[ SILENT ]{CLR_RESET}{CLR_DIM}                                         │{CLR_RESET}")
            print(f" │  GPIO 21 [SOLENOID RELAY] ─▶ {CLR_DIM}[ UNLOCKED / DISENGAGED ]{CLR_RESET}{CLR_DIM}                           │{CLR_RESET}")
            print(f" │  GPIO 19 [GREEN STATUS] ──▶ {CLR_GREEN}{CLR_BOLD}[ ● STEADY ON - PUBLIC KIOSK ACTIVE ]{CLR_RESET}{CLR_DIM}       │{CLR_RESET}")

        print(f"{CLR_DIM} │                                                                     │{CLR_RESET}")
        print(f"{CLR_DIM} └─────────────────────────────────────────────────────────────────────┘{CLR_RESET}")

        # Active Interdiction Event Box
        if self.is_alarm_active:
            elapsed = time.time() - self.alarm_start_time
            remaining = max(0.0, self.alarm_duration_s - elapsed)
            
            print(f"\n{BG_RED}{CLR_WHITE}{CLR_BOLD} ⚡⚡⚡ PHYSICAL ATM LOCK TRIGGERED // SECTION 106 BNSS ⚡⚡⚡ {CLR_RESET}")
            print(f"{CLR_RED}{CLR_BOLD} ┌────────────────────────────────────────────────────────────────────────┐{CLR_RESET}")
            print(f"{CLR_RED}{CLR_BOLD} │ Target Terminal ID : {self.terminal_id:<49} │{CLR_RESET}")
            print(f"{CLR_RED}{CLR_BOLD} │ Targeted Mule Acct : {self.target_account:<49} │{CLR_RESET}")
            print(f"{CLR_RED}{CLR_BOLD} │ Statutory Order    : {self.statutory_power:<49} │{CLR_RESET}")
            print(f"{CLR_RED}{CLR_BOLD} │ Alarm Strobe Timer : {remaining:4.1f}s remaining (Duration: {self.alarm_duration_s:.0f}s)                │{CLR_RESET}")
            print(f"{CLR_RED}{CLR_BOLD} └────────────────────────────────────────────────────────────────────────┘{CLR_RESET}")
            print(f"\n {CLR_GREEN}{CLR_BOLD}[✓] STATUTORY ASSURANCE:{CLR_RESET} Physical ATM vestibule remains 100% operational for citizens.")
            print(f"     Only suspect session card-flow is interdicted at core switch level.")
        else:
            print(f"\n{CLR_GREEN}{CLR_BOLD} [STATUS: ALL SYSTEMS NOMINAL]{CLR_RESET}")
            print(f" Physical beacon listening for Section 106 BNSS bank friction broadcast triggers.")
            print(f" Trigger via UI: {CLR_CYAN}POST /api/v1/bank/friction{CLR_RESET} or Action Console button.")

        print(f"\n{CLR_DIM}Press Ctrl+C to terminate hardware emulator.{CLR_RESET}")

    async def run(self):
        import websockets

        while True:
            try:
                print(f"{CLR_YELLOW}[*] Connecting to Aegis Hardware Beacon Bridge: {self.ws_url}...{CLR_RESET}")
                async with websockets.connect(self.ws_url) as ws:
                    self.is_connected = True
                    self.render_display()

                    # Concurrent loop: receiver and local display updater
                    while True:
                        # Non-blocking receive with 0.1s timeout to update strobe animation
                        try:
                            raw_msg = await asyncio.wait_for(ws.recv(), timeout=0.15)
                            data = json.loads(raw_msg)
                            event_type = data.get("event")

                            if event_type == "ATM_SESSION_LOCKED":
                                self.is_alarm_active = True
                                self.alarm_start_time = time.time()
                                self.alarm_duration_s = float(data.get("strobe_ms", 15000)) / 1000.0
                                self.buzzer_freq = data.get("buzzer_freq", 2400)
                                self.terminal_id = data.get("terminal_id", "ATM-DL-9082")
                                self.target_account = data.get("target_account", "YESB00010921")
                                self.statutory_power = data.get("statutory_power", "SECTION_106_BNSS")
                                self.total_triggers += 1
                                # Ring terminal bell
                                sys.stdout.write("\a")
                                sys.stdout.flush()

                        except asyncio.TimeoutError:
                            pass

                        # Update alarm state countdown
                        if self.is_alarm_active:
                            self.strobe_tick += 1
                            if time.time() - self.alarm_start_time >= self.alarm_duration_s:
                                self.is_alarm_active = False

                        self.render_display()

            except Exception as e:
                self.is_connected = False
                self.render_display()
                print(f"\n{CLR_RED}[!] Connection error: {e}. Retrying in 2.0s...{CLR_RESET}")
                await asyncio.sleep(2.0)


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "ws://127.0.0.1:8000/ws/hardware/beacon"
    emulator = MockHardwareBeacon(url)
    try:
        asyncio.run(emulator.run())
    except KeyboardInterrupt:
        clear_screen()
        print(f"\n{CLR_CYAN}[+] Mock Hardware Terminal gracefully stopped.{CLR_RESET}\n")
