# CargoCrypt: Zero-Knowledge Maritime Telemetry & Tamper-Evident Tracking

> **A hardware-grade cryptographic proof system for maritime supply chains, securing container telemetry across untrusted satellite networks using browser-native WebCrypto primitives.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![WebCrypto API](https://img.shields.io/badge/Cryptography-W3C%20WebCrypto%20Subtle-10b981.svg)](https://www.w3.org/TR/WebCryptoAPI/)
[![Standards](https://img.shields.io/badge/Standards-NIST%20FIPS%20197%20%7C%20180--4%20%7C%20186--4-047857.svg)](https://csrc.nist.gov/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.x-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Framework-React%2019-06b6d4.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build%20Tool-Vite%208-bd34fe.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v3-38bdf8.svg)](https://tailwindcss.com/)
[![GIS](https://img.shields.io/badge/GIS-Leaflet%201.9%20%7C%20ESRI%20Dark-f59e0b.svg)](https://leafletjs.com/)
[![Dependencies](https://img.shields.io/badge/External%20Crypto%20Deps-Zero-brightgreen.svg)](#cryptographic-architecture)

---

## Table of Contents
- [1. Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
- [2. Cryptographic Architecture & Mathematical Formulations](#2-cryptographic-architecture--mathematical-formulations)
  - [Pipeline Flow](#cryptographic-pipeline-flow)
  - [Mathematical Formulations](#mathematical-formulations)
  - [Security Verification Matrix](#security-verification-matrix)
- [3. Interactive 3-Panel SOC Dashboard & MITM Workbench](#3-interactive-3-panel-soc-dashboard--mitm-workbench)
  - [Panel 1: IoT Edge Device (TransCrypt Smart-Seal HSM)](#panel-1-iot-edge-device-transcrypt-smart-seal-hsm)
  - [Panel 2: Untrusted Intermediate Relay (MITM Workbench)](#panel-2-untrusted-intermediate-relay-mitm-workbench)
  - [Panel 3: Authorized Consignee Enclave (Mumbai Port Customs Ops)](#panel-3-authorized-consignee-enclave-mumbai-port-customs-ops)
  - [SOC Layout Switcher](#soc-layout-switcher)
- [4. Red Team Attack Suite & Live Simulation](#4-red-team-attack-suite--live-simulation)
- [5. Realistic Maritime Route (Singapore ➔ Mumbai)](#5-realistic-maritime-route-singapore--mumbai)
- [6. Web Audio Procedural Synthesis](#6-web-audio-procedural-synthesis)
- [7. Repository Structure](#7-repository-structure)
- [8. Technology Stack](#8-technology-stack)
- [9. Getting Started](#9-getting-started)
- [10. Cryptographic Proof Certificate Specification](#10-cryptographic-proof-certificate-specification)
- [11. License & Acknowledgments](#11-license--acknowledgments)

---

## 1. Executive Summary & Problem Statement

Global maritime shipping moves **90% of world trade** across oceans via intermodal shipping containers. However, the international maritime relay infrastructure suffers from critical security vulnerabilities:

1. **Untrusted Intermediate Transport Relays**: Telemetry dispatched via Inmarsat-C satellite uplinks, coastal AIS towers, and public internet routing passes through unauthenticated third-party relays susceptible to eavesdropping, packet interception, and corporate espionage.
2. **Cargo Tampering & Piracy in High-Seas Corridors**: In choke points like the Malacca Strait and Gulf of Aden, unauthorized container opening, seal replacement, and high-value cargo theft (electronics, pharmaceuticals, defense cargo) often go undetected until customs unloading weeks later.
3. **Cold-Chain Spoilage & Data Falsification**: Temperature-sensitive goods (vaccines, biologics, perishable food) risk spoilage if refrigeration units fail. Unscrupulous shippers or rogue operators can manipulate or replay historical telemetry logs to conceal temperature excursions.
4. **Spoofing & Man-In-The-Middle (MITM) Injections**: Standard AIS and IoT telemetry protocols transmit unauthenticated or weakly encrypted packets that attackers can forge, replay, or alter in flight.

### The CargoCrypt Solution
**CargoCrypt** introduces a **Zero-Knowledge, Tamper-Evident Maritime Ledger** that pairs an onboard container Hardware Security Module (HSM) with an Authorized Consignee Enclave at destination ports (e.g., Jawaharlal Nehru Port / Mumbai).

By combining **AES-GCM-256 authenticated encryption**, **continuous SHA-256 hash chaining**, and **ECDSA P-256 asymmetric enclave signatures**, CargoCrypt mathematically guarantees:
- **Zero-Knowledge Privacy**: Intermediate satellite relays and eavesdroppers see only high-entropy pseudorandom ciphertexts ($H \approx 7.98$ bits/byte). No coordinates, temperatures, or cargo states leak.
- **Instant Tamper Detection**: If even a single bit is modified in transit, the AES-GCM AEAD authentication tag and SHA-256 ledger mismatch instantly, triggering bright crimson quarantines.
- **Replay Protection**: Strict monotonic sequence tracking drops any duplicate or expired packet injection.
- **Physical Breach Geo-Tagging**: Micro-optical hermetic sensors register light intrusion ($>50\text{ Lux}$ vs $<5\text{ Lux}$ pitch dark), immediately alerting port authorities with GPS timestamps.

---

## 2. Cryptographic Architecture & Mathematical Formulations

CargoCrypt is built **strictly using the browser-native W3C Web Crypto API (`window.crypto.subtle`)** without external crypto libraries, adhering to NIST FIPS standards:

### Cryptographic Pipeline Flow

```
[IoT Smart-Seal HSM (Container Edge)]
  │
  ├─ 1. Physical Sensor Readout: {lat, lng, temp, lux, shock, battery, seq, timestamp}
  ├─ 2. 12-Byte Cryptographic IV: window.crypto.getRandomValues(new Uint8Array(12))
  ├─ 3. AES-GCM-256 Authenticated Encryption: Produces Ciphertext + 128-bit AEAD Tag
  ├─ 4. SHA-256 Hash Chain Linking: H[i] = SHA-256(H[i-1] || Ciphertext || Seq || Timestamp)
  └─ 5. ECDSA P-256 Hardware Signature on H[i]
        │
        ▼ (Inmarsat-C Satellite Uplink Burst)
[Untrusted Satellite Relay & MITM Workbench]
  │ • Zero-Knowledge: High Shannon Entropy (7.98 bits/byte)
  │ • Raw Hex / 16-Byte Offset ASCII Memory Inspector
  │ • Real-Time Packet Mutation & Replay Injection
        │
        ▼ (Secure Customs Gateway)
[Authorized Consignee Enclave (Port of Mumbai)]
  │
  ├─ Multi-Layer Cryptographic Verification Engine:
  │   ├── Layer 1: Monotonic Sequence Check (Seq == LastSeq + 1)  ──> Drops Replay Attacks
  │   ├── Layer 2: SHA-256 Hash Recalculation (H_calc == H_pkt)   ──> Flags Hash Chain Corruption
  │   ├── Layer 3: AES-GCM AEAD Tag Authentication                ──> Traps Bit-Level Payload Tampering
  │   ├── Layer 4: ECDSA P-256 Hardware Signature Verification   ──> Proves Genuine Edge HSM Identity
  │   └── Layer 5: Hermetic Optical Threshold Check (Lux < 50lx)  ──> Detects Physical Container Breaches
  │
  └─ Verified Outputs: Live Nautical Route Update + Cryptographic Audit Trail Certificate
```

### Mathematical Formulations

#### 1. AES-GCM-256 Authenticated Encryption
$$\text{Ciphertext}, \text{Tag}_{128} = \text{AES-GCM}_{K_{256}}(\text{IV}_{96}, \text{Payload}_{\text{JSON}})$$
- **Confidentiality**: Telemetry cannot be decoded without the 256-bit symmetric session key $K_{256}$.
- **Integrity**: The 128-bit Galois Message Authentication Code (GMAC) tag guarantees that any modification to the ciphertext or initialization vector causes decryption to abort.

#### 2. Tamper-Evident SHA-256 Hash Chaining
Given the Genesis Root $H_0 = 0^{64}$, every subsequent block hash $H_i$ cryptographically binds to its antecedent:
$$H_i = \text{SHA-256}\Big(H_{i-1} \;\parallel\; \text{Ciphertext}_i \;\parallel\; \text{Seq}_i \;\parallel\; \text{Timestamp}_i\Big)$$
Any post-emission alteration of $\text{Ciphertext}_i$, $\text{Seq}_i$, or retrofitting an earlier block produces an irreversible avalanche effect across all downstream hashes.

#### 3. ECDSA P-256 Asymmetric Hardware Signatures
Hardware enclave authentication via elliptic curve signatures over the hash block:
$$\sigma_i = \text{ECDSA-Sign}_{\text{SK}_{\text{HSM}}}(H_i), \qquad \text{Verify}_{\text{PK}_{\text{HSM}}}(H_i, \sigma_i) \in \{\text{Valid}, \text{Invalid}\}$$

#### 4. Shannon Entropy Verification
To mathematically demonstrate zero-knowledge confidentiality to eavesdroppers:
$$H(X) = -\sum_{i=0}^{255} P(x_i) \log_2 P(x_i) \approx 7.98 \text{ bits/byte} \quad (\text{Theoretical Maximum} = 8.00)$$

---

### Security Verification Matrix

| Verification Layer | Mathematical Primitive | Target Attack Vector | Enclave Failure Behavior |
|---|---|---|---|
| **Layer 1: Anti-Replay** | Monotonic Counter ($\text{Seq} > \text{Seq}_{\text{last}}$) | Historical packet injection, replay loops | `REPLAY_DROPPED`: Packet dropped, audio alert |
| **Layer 2: Chain Integrity** | SHA-256 Hash Recalculation | Block insertion, deletion, reordering | `TAMPER_HASH_FAIL`: Chain halted, red warning banner |
| **Layer 3: AEAD Authenticity** | AES-GCM 128-bit Tag | In-flight payload mutation, MITM byte flipping | `TAMPER_AEAD_FAIL`: OperationError, Error `0x4B2` |
| **Layer 4: Hardware Provenance**| ECDSA P-256 Signature Verification | Rogue satellite impersonation, rogue sensors | `SIGNATURE_FAIL`: Provenance breach, alert flagged |
| **Layer 5: Hermetic Optical** | Physical Threshold ($\text{Lux} < 50$) | Container door opening, illicit seal tampering | `PHYSICAL_BREACH`: GPS geo-tagged beacon on map |

---

## 3. Interactive 3-Panel SOC Dashboard & MITM Workbench

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│     PANEL 1: IOT EDGE DEVICE    │  PANEL 2: UNTRUSTED RELAY STREAM│   PANEL 3: AUTHORIZED CONSIGNEE │
│   (TransCrypt Smart-Seal HSM)   │     (MITM Tamper Workbench)     │       (Mumbai Port Ops)         │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ • Modes: Manual Ping /          │ • In-Flight Packet Buffer:      │ • Consignee Key Management:     │
│   Cruise Mode (3s Interval)     │   - Live Editable Ciphertext    │   - Key Mounted (Authorized)    │
│ • Real-Time Sensor Sliders:     │   - 12-Byte Editable IV Input   │   - Key Revoked (Zero-Knowledge)│
│   - Temp: -20°C to +40°C        │ • Corrupt Bit & Forward Button  │ • Leaflet Nautical GIS Map:     │
│   - Light: 0 to 1000 Lux        │ • Forward As-Is (Untampered)    │   - ESRI Dark, Satellite, Cyber │
│   - Shock: 0.0G to 5.0G         │ • Inject Replay Block Button    │ • Staged GPS Target Waypoint    │
│ • Cryptographic Construction:   │ • Shannon Entropy: 7.98 bits    │ • Live Breach Incident Card:    │
│   6-Step Pipeline Visualizer    │ • 16-Byte Hex / ASCII Inspector │   - Expected vs Calc Hash Diff  │
│ • Hardware Security Module:     │ • Intercepted Telemetry Log:    │   - Integrity Error 0x4B2       │
│   AES-256 & ECDSA Key Inspector │   Timestamped Payload Stream    │ • Filterable Incident Ledger    │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

### Panel 1: IoT Edge Device (TransCrypt Smart-Seal HSM)
- **Manual Ping & Cruise Mode**: Dispatch individual packets or enable automated sailing bursts every 3 seconds.
- **Dynamic Sensor Controls**:
  - **Temperature**: Range from $-20^\circ\text{C}$ to $+40^\circ\text{C}$ for pharma and reefer container simulations.
  - **Hermetic Light Level**: Range from $0$ to $1000\text{ Lux}$ (nominal dark container is $<5\text{ Lux}$).
  - **3-Axis Accelerometer (Shock)**: Range from $0.0\text{G}$ to $5.0\text{G}$ for rough sea states or impact.
  - **Battery & Barometric Sensors**: Real-time voltage depletion and atmospheric pressure readouts.
- **6-Step Cryptographic Construction Pipeline**: Step-by-step telemetry packaging, IV generation, AES-GCM encryption, hash linking, and ECDSA signature creation.
- **Target Selection**: Click any nautical waypoint on the map or panel to stage destination coordinates.

### Panel 2: Untrusted Intermediate Relay (MITM Workbench)
- **Real-Time Transit Workbench**: Every transmitted burst halts in flight at the intermediate relay.
- **Interactive Hex & IV Editors**: Modify hex bytes directly in the text areas to simulate bit-level network corruption.
- **Action Triggers**:
  - `Corrupt Bit & Forward`: Programmatically flips a character in the ciphertext to demonstrate AEAD tag failure.
  - `Forward As-Is (Untampered)`: Forwards the authentic packet down the relay pipeline.
  - `Inject Replay Block`: Clones an expired block sequence into the stream to trigger anti-replay traps.
- **Shannon Entropy Gauge**: Demonstrates near-theoretical maximum entropy ($H \approx 7.98\text{ bits/byte}$) to prove that adversaries see purely pseudorandom noise.
- **16-Byte Hex / ASCII Memory Inspector**: Aligned hex offsets and ASCII decoded columns.

### Panel 3: Authorized Consignee Enclave (Mumbai Port Customs Ops)
- **Zero-Knowledge Key Handshake**: Toggle between **"Consignee Key Mounted"** and **"Revoke / Unload Key"**. In revoked mode, all coordinates and sensor readouts are mathematically masked with `"LOCKED: VALID SESSION KEY REQUIRED"`.
- **GIS Nautical Map**: Interactive Leaflet engine with customized vessel icons, waypoint breadcrumbs, glowing route polylines, and pulsing red breach beacons.
- **Incident Failure Card**: When an attack is detected, displays side-by-side **Expected SHA-256 vs Calculated SHA-256** differences with the exact integrity failure code (`Error 0x4B2`).
- **Forensic Audit Ledger**: Filterable history table (All, Verified, Tampered, Breached, Replayed) with millisecond-precision processing times.
- **Export Certificate**: Generates downloadable tamper-evident JSON audit certificates.

---

### SOC Layout Switcher
The top navigation bar provides instant switching between 4 specialized views:

1. **Split SOC View (Tri-Panel)**: Side-by-side demonstration of IoT Edge, Relay, and Consignee.
2. **IoT Edge Terminal**: Enlarged smart-seal controls, sensor sliders, and cryptographic HSM pipeline.
3. **Cloud Interceptor**: Full-width MITM tampering lab with raw memory inspection and entropy analysis.
4. **Consignee Portal**: Full-screen maritime operations command room with nautical chart and forensic ledger.

---

## 4. Red Team Attack Suite & Live Simulation

The top navigation bar features dedicated attack triggers to evaluate system resilience in real time:

| Attack Vector | Simulation Trigger | Cryptographic Mechanism Triggered | Consignee Output & Response |
|---|---|---|---|
| **MITM Ciphertext Tamper** | Click `Trigger MITM Tamper` or `Corrupt Bit & Forward` | Inverts a byte in the encrypted payload during transit. | **`INTEGRITY BREACH: HASH MISMATCH AT BLOCK #X (AES-GCM Auth Tag Failure)`** in bright crimson; sirens sound; packet quarantined. |
| **Replay Attack** | Click `Trigger Replay Attack` or `Inject Replay Block` | Injects an expired sequence packet ($K \le \text{currentSeq}$). | **`REPLAY DETECTED: Sequence #X is expired or duplicate`**; packet dropped immediately by monotonic sequence check. |
| **Physical Seal Breach** | Click `Trigger Physical Breach` | Spikes container interior optical sensor to **924 Lux**. | **`PHYSICAL CONTAINER BREACH: CARGO DOOR OPENED (LUX 900+). GEO-COORDINATES FLAGGED ON MARITIME MAP.`** Map pin pulses with crimson emergency beacon. |
| **Reset Voyage** | Click `Reset Voyage` | Reinitializes cryptographic keys, route, and state. | Fresh AES-256 session key & ECDSA P-256 keypair generated; route reset to Waypoint #1 (Singapore Strait). |

---

## 5. Realistic Maritime Route (Singapore ➔ Mumbai)

The voyage simulates **15 authentic maritime waypoints** traversing international shipping fairways and Traffic Separation Schemes (TSS):

| # | Waypoint Name | Sea Region | Coordinates | Nominal Temp | Nominal Lux | Fairway Description |
|---|---|---|---|---|---|---|
| 01 | **Singapore Strait Departure** | Singapore Strait | $1.2580^\circ\text{N}, 103.8550^\circ\text{E}$ | $23.2^\circ\text{C}$ | 2 lx | Eastern Anchorage departure; Smart-Seal HSM initialized. |
| 02 | **Singapore Strait West Fairway** | Singapore Strait | $1.2150^\circ\text{N}, 103.6200^\circ\text{E}$ | $23.4^\circ\text{C}$ | 3 lx | Passing Raffles Lighthouse TSS into Malacca Strait bottleneck. |
| 03 | **Tanjung Piai / Kukup Deepwater** | Malacca (South) | $1.3800^\circ\text{N}, 103.1500^\circ\text{E}$ | $23.5^\circ\text{C}$ | 2 lx | Southernmost continental tip of Asia; coastal AIS to Inmarsat-C. |
| 04 | **Malacca Central / Port Dickson** | Malacca (Central) | $2.1800^\circ\text{N}, 102.0500^\circ\text{E}$ | $23.1^\circ\text{C}$ | 1 lx | High traffic density corridor; satellite uplink verification. |
| 05 | **Port Klang Gateway Fairway** | Malacca (Central) | $3.0500^\circ\text{N}, 101.1200^\circ\text{E}$ | $23.3^\circ\text{C}$ | 3 lx | Approaching One Fathom Bank; high collision-risk transit. |
| 06 | **Penang Channel Approach** | Malacca (North) | $5.3500^\circ\text{N}, 99.8500^\circ\text{E}$ | $22.8^\circ\text{C}$ | 2 lx | Exiting Strait of Malacca into the Andaman Sea basin. |
| 07 | **Great Channel / Andaman Entry** | Andaman Sea | $6.2500^\circ\text{N}, 95.1500^\circ\text{E}$ | $22.9^\circ\text{C}$ | 2 lx | Deep ocean corridor; transition to oceanic satellite telemetry. |
| 08 | **South Nicobar Corridor** | Bay of Bengal | $6.5500^\circ\text{N}, 90.8000^\circ\text{E}$ | $23.0^\circ\text{C}$ | 3 lx | Southern Bay of Bengal shipping artery; monsoon swell zone. |
| 09 | **Central Indian Ocean Fairway** | Indian Ocean | $6.2000^\circ\text{N}, 85.5000^\circ\text{E}$ | $23.4^\circ\text{C}$ | 2 lx | Major equatorial east-west container shipping lane. |
| 10 | **Dondra Head, Sri Lanka** | Laccadive Sea | $5.8200^\circ\text{N}, 80.5800^\circ\text{E}$ | $23.6^\circ\text{C}$ | 2 lx | Pivotal global maritime crossroads off the southern coast of Sri Lanka. |
| 11 | **Cape Comorin Outer Passage** | Arabian Sea | $7.4500^\circ\text{N}, 76.9000^\circ\text{E}$ | $23.1^\circ\text{C}$ | 3 lx | Rounding Kanyakumari; northward turn toward the Indian subcontinent. |
| 12 | **Kochi Deepwater Corridor** | Malabar Coast | $9.8500^\circ\text{N}, 75.3500^\circ\text{E}$ | $23.0^\circ\text{C}$ | 2 lx | Malabar Coast coastal fairway; fishing fleet avoidance corridor. |
| 13 | **Goa Coastal Shipping Channel** | Arabian Sea (Central)| $14.8000^\circ\text{N}, 73.1500^\circ\text{E}$ | $23.2^\circ\text{C}$ | 2 lx | Approaching Mumbai maritime traffic management sector. |
| 14 | **Mumbai Outer Anchorage** | Mumbai Approach | $18.7000^\circ\text{N}, 72.6500^\circ\text{E}$ | $23.5^\circ\text{C}$ | 3 lx | Pilot boarding station; cryptographic pre-clearance handoff. |
| 15 | **Port of Mumbai / JNPT Terminal** | Jawaharlal Nehru Port | $18.9500^\circ\text{N}, 72.9500^\circ\text{E}$ | $23.7^\circ\text{C}$ | 4 lx | Final berth docking; complete voyage cryptographic ledger verified. |

---

## 6. Web Audio Procedural Synthesis

CargoCrypt incorporates a zero-asset, procedural audio engine built on the native browser **Web Audio API** (`AudioContext`), providing real-time acoustic feedback:

- **Sonar Ping ($880\text{ Hz} \to 220\text{ Hz}$ sine decay)**: Transmitted whenever an encrypted telemetry burst departs the edge HSM.
- **Keygen Sweep ($300\text{ Hz} \to 1200\text{ Hz}$ linear chirp)**: Triggered during cryptographic key pair generation.
- **Verification Chime (C-E-G Major Triad)**: Plays upon successful 5-layer cryptographic validation at the port enclave.
- **Dual-Tone Security Siren ($950\text{ Hz} / 650\text{ Hz}$ square wave alternation)**: Alerts operators upon detection of MITM tampering, replay injection, or hermetic container breach.
- **Mechanical Click ($1200\text{ Hz}$ impulse pulse)**: Tactile UI feedback on interaction controls.
- **Audio Mute/Unmute**: Global toggle located in the top navigation bar.

---

## 7. Repository Structure

```
cargocrypt/
├── public/                     # Static assets, SVG icons, and favicons
├── src/
│   ├── assets/                 # Brand assets and imagery
│   ├── components/             # Modular React UI components
│   │   ├── AuditLedgerModal.tsx   # Comprehensive cryptographic audit trail & JSON export
│   │   ├── CenterPanelRelay.tsx   # Untrusted relay stream & interactive MITM workbench
│   │   ├── HeaderBar.tsx          # Navigation, status indicators, and SOC view switcher
│   │   ├── HexViewer.tsx          # Aligned 16-byte Hex & ASCII memory inspector
│   │   ├── LeftPanelIoT.tsx       # TransCrypt Smart-Seal HSM, sliders & pipeline visualizer
│   │   ├── MapView.tsx            # Leaflet GIS maritime tracking map with multi-layer tiles
│   │   └── RightPanelConsignee.tsx# Mumbai Port customs enclave & failure analysis card
│   ├── crypto/                 # Browser-native cryptographic primitives
│   │   └── webcrypto.ts           # AES-GCM-256, SHA-256 hash chain, ECDSA P-256 & entropy
│   ├── data/                   # Navigation and domain datasets
│   │   └── waypoints.ts           # 15 Singapore-to-Mumbai nautical waypoints and metadata
│   ├── sound/                  # Audio synthesis engine
│   │   └── audioEffects.ts        # Native Web Audio API procedural sound generators
│   ├── types/                  # TypeScript interfaces and domain schemas
│   │   └── crypto.ts              # Telemetry, EncryptedPacket, ConsigneeLogEntry interfaces
│   ├── App.css                 # Base component styling and Leaflet overrides
│   ├── App.tsx                 # Core state coordinator and cryptographic orchestrator
│   ├── index.css               # Tailwind CSS declarations and custom font utilities
│   └── main.tsx                # Application bootstrap entry point
├── .gitignore                  # Git tracking exclusion rules
├── .oxlintrc.json              # Oxlint performance linter configuration
├── index.html                  # HTML5 shell with responsive viewport configuration
├── package.json                # Project dependencies, metadata, and build scripts
├── postcss.config.js           # PostCSS Tailwind plugin pipeline
├── tailwind.config.js          # Custom theme palettes, animations, and border rules
├── tsconfig.app.json           # Application TypeScript compiler settings
├── tsconfig.json               # Root TypeScript configuration
├── tsconfig.node.json          # Vite Node environment TypeScript configuration
├── vite.config.ts              # Vite 8 bundling and React plugin configuration
└── README.md                   # Comprehensive technical documentation
```

---

## 8. Technology Stack

- **Core Framework**: React 19, TypeScript 5.x, Vite 8
- **Cryptography Engine**: Pure W3C Web Crypto API (`window.crypto.subtle`) — *Zero external cryptography dependencies*
- **Geographic Information Systems (GIS)**: Leaflet 1.9, React-Leaflet 5
  - *Tile Layer 1*: ESRI World Dark Gray Canvas
  - *Tile Layer 2*: ESRI World Imagery (High-Resolution Satellite)
  - *Tile Layer 3*: Cyber Inverted OpenStreetMap
- **Styling & Design System**: Tailwind CSS v3 with matte black `#05070b` palette, emerald verified states, amber transit payloads, and crimson alerts
- **Iconography**: Lucide-react
- **Audio Synthesis**: Browser-native Web Audio API procedural synthesis

---

## 9. Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v24.x` (LTS recommended)
- **npm**: `v10.x` or `v11.x`

### Installation & Execution

```bash
# 1. Clone the repository
git clone https://github.com/abhinav-2021/CargoCrypt.git
cd CargoCrypt

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173/`**.

### Production Build & Linting

```bash
# Typecheck and compile production bundle
npm run build

# Preview production build locally
npm run preview

# Run fast Oxlint code quality checks
npm run lint
```

---

## 10. Cryptographic Proof Certificate Specification

CargoCrypt exports standardized, machine-readable JSON certificates designed for automated validation by port authorities, maritime insurers, and customs agencies:

```json
{
  "title": "CargoCrypt Tamper-Evident Maritime Audit Certificate",
  "timestamp": "2026-11-01T03:30:00.000Z",
  "standards": "NIST FIPS 197 (AES-256-GCM), FIPS 180-4 (SHA-256), FIPS 186-4 (ECDSA P-256)",
  "cryptoImplementation": "W3C Browser-Native Web Crypto API (SubtleCrypto)",
  "genesisHash": "0000000000000000000000000000000000000000000000000000000000000000",
  "deviceFingerprint": "HSM-9B4F-82AE-C13D",
  "devicePublicKeySPKI": "3059301306072a8648ce3d020106082a8648ce3d03010703420004...",
  "summary": {
    "totalBlocks": 15,
    "verifiedBlocks": 15,
    "integrityBreachesCaught": 0,
    "integrityStatus": "ALL_BLOCKS_VALIDATED"
  },
  "auditTrail": [
    {
      "seq": 1,
      "timestamp": 1793503800000,
      "status": "VERIFIED",
      "calculatedHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "receivedHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "hashMatch": true,
      "aeadValid": true,
      "signatureValid": true,
      "replayValid": true,
      "message": "Cryptographic proof verified: AES-GCM AEAD Tag & SHA-256 Valid",
      "telemetry": {
        "seq": 1,
        "lat": 1.258,
        "lng": 103.855,
        "temp": 23.2,
        "lux": 2,
        "shockG": 0.05,
        "battery": 99.8,
        "doorSealed": true
      }
    }
  ]
}
```

---

## 11. License & Acknowledgments

This project is licensed under the [MIT License](LICENSE).

Developed for **Securathon** — Securing the Oceans with Zero-Knowledge Cryptography.
