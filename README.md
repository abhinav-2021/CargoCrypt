# CargoCrypt: Zero-Knowledge Maritime Telemetry & Tamper-Evident Tracking

> **A hardware-grade cryptographic proof system for maritime supply chains, securing container telemetry across untrusted satellite networks using browser-native WebCrypto primitives.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](#)
[![WebCrypto API](https://img.shields.io/badge/Cryptography-W3C%20WebCrypto%20Subtle-10b981.svg)](#)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.x-blue.svg)](#)
[![React](https://img.shields.io/badge/Framework-React%2019-cyan.svg)](#)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet%20Dark%20Canvas-amber.svg)](#)

---

## 1. Executive Summary & Problem Statement

Global maritime shipping moves **90% of world trade** across oceans via intermodal shipping containers. However, the international maritime relay infrastructure suffers from critical security vulnerabilities:

1. **Untrusted Intermediate Transport Relays**: Telemetry dispatched via Inmarsat-C satellite uplinks, coastal AIS towers, and public internet routing passes through unauthenticated third-party relays susceptible to eavesdropping, packet interception, and corporate espionage.
2. **Cargo Tampering & Piracy in High-Seas Corridors**: In choke points like the Malacca Strait and Gulf of Aden, unauthorized container opening, seal replacement, and high-value cargo theft (electronics, pharmaceuticals, defense cargo) often go undetected until customs unloading weeks later.
3. **Cold-Chain Spoilage & Data Falsification**: Temperature-sensitive goods (vaccines, biologics, perishable food) risk spoilage if refrigeration units fail. Unscrupulous shippers or rogue operators can manipulate or replay historical telemetry logs to conceal temperature excursions.
4. **Spoofing & Man-In-The-Middle (MITM) Injections**: Standard AIS and IoT telemetry protocols transmit unauthenticated or weakly encrypted packets that attackers can forge, replay, or alter in flight.

### The CargoCrypt Solution
**CargoCrypt** introduces a **Zero-Knowledge, Tamper-Evident Maritime Ledger** that pairs an onboard container Hardware Security Module (HSM) with an Authorized Consignee Enclave at destination ports (e.g., Jawaharlal Nehru Port / Mumbai).

By combining **AES-GCM-256 authenticated encryption**, **SHA-256 continuous hash chaining**, and **ECDSA P-256 asymmetric enclave signatures**, CargoCrypt mathematically guarantees:
- **Zero-Knowledge Privacy**: Intermediate satellite relays and eavesdroppers see only high-entropy pseudorandom ciphertexts ($H \approx 7.98$ bits/byte). No coordinates, temperatures, or cargo states leak.
- **Instant Tamper Detection**: If even a single bit is modified in transit, the AES-GCM AEAD authentication tag and SHA-256 ledger mismatch instantly, triggering bright crimson quarantines.
- **Replay Protection**: Strict monotonic sequence tracking drops any duplicate or expired packet injection.
- **Physical Breach Geo-Tagging**: Micro-optical hermetic sensors register light intrusion ($>50\text{ Lux}$ vs $<5\text{ Lux}$ pitch dark), immediately alerting port authorities with GPS timestamps.

---

## 2. Cryptographic Architecture

CargoCrypt is built **strictly using the browser-native W3C Web Crypto API (`window.crypto.subtle`)** without external crypto libraries, adhering to NIST FIPS standards:

```
[IoT Smart-Seal HSM]
  │
  ├─ 1. Sensor Readout: {lat, lng, temp, lux, seq, timestamp}
  ├─ 2. 12-Byte Random IV: window.crypto.getRandomValues(new Uint8Array(12))
  ├─ 3. AES-GCM-256 Encryption: Ciphertext + 128-bit AEAD Tag
  ├─ 4. SHA-256 Hash Chain: H[i] = SHA-256(H[i-1] || Ciphertext || Seq || Timestamp)
  └─ 5. ECDSA P-256 Hardware Signature on H[i]
        │
        ▼ (Satellite Uplink Burst)
[Untrusted Satellite Relay / Hacker View]
  │ • Zero-Knowledge: High Entropy (7.98 bits/byte)
  │ • No Plaintext Visibility
  │ • Vulnerable to MITM / Replay attempts
        │
        ▼ (Port of Mumbai Customs Gateway)
[Authorized Consignee Enclave]
  │
  ├─ Multi-Layer Cryptographic Verification:
  │   ├── Check 1: Monotonic Sequence Check (Seq == LastSeq + 1) ──> Rejects Replay Attacks
  │   ├── Check 2: SHA-256 Hash Recalculation (H_calc == H_pkt) ───> Flags Hash Inconsistencies
  │   ├── Check 3: AES-GCM AEAD Tag Authentication ───────────────> Catches Bit-level MITM Tampering
  │   ├── Check 4: ECDSA P-256 Enclave Signature Verification ───> Proves Hardware Provenance
  │   └── Check 5: Sensor Threshold Bounds Check (Lux < 50lx) ────> Flags Physical Cargo Openings
  │
  └─ Verified Output: Live Nautical Map + Cryptographic Audit Trail Certificate
```

### Mathematical Formulations

#### 1. AES-GCM-256 Authenticated Encryption
$$\text{Ciphertext}, \text{Tag}_{128} = \text{AES-GCM}_{K_{256}}(\text{IV}_{96}, \text{Payload}_{\text{JSON}})$$

#### 2. Tamper-Evident SHA-256 Hash Chaining
Given genesis hash $H_0 = 0^{64}$, every subsequent block hash $H_i$ is bound to the previous block:
$$H_i = \text{SHA-256}\Big(H_{i-1} \;\parallel\; \text{Ciphertext}_i \;\parallel\; \text{Seq}_i \;\parallel\; \text{Timestamp}_i\Big)$$
Any post-emission alteration of $\text{Ciphertext}_i$ alters $H_i$, invalidating the entire subsequent chain.

#### 3. Shannon Entropy Verification
To empirically prove zero-knowledge to eavesdroppers:
$$H(X) = -\sum_{i=0}^{255} P(x_i) \log_2 P(x_i) \approx 7.98 \text{ bits/byte} \quad (\text{Max theoretical } = 8.00)$$

---

## 3. The 3-Panel Interactive Dashboard

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│     PANEL 1: IOT EDGE DEVICE    │  PANEL 2: UNTRUSTED RELAY STREAM│   PANEL 3: AUTHORIZED CONSIGNEE │
│   (TransCrypt Smart-Seal HSM)   │     (Hacker Intercept View)     │       (Mumbai Port Ops)         │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ • Container Light Sensor (Lux)  │ • Live Intercept Stream         │ • Dark Leaflet Nautical Map     │
│ • Cargo Temp (°C/°F Reefer)     │ • Raw Ciphertext Hex Stream     │ • 15 Nautical Waypoints         │
│ • Battery Voltage & Discharge   │ • Shannon Entropy: 7.98 bits    │ • Real-Time Decrypted Metrics   │
│ • Swell / Shock G-Force         │ • 16-Byte Hex / ASCII Viewer    │ • Multi-Layer Validation Ledger │
│ • 6-Step Construction Pipeline  │ • Packet Search & JSON Inspector│ • Tamper Beacon / Emergency HUD │
│ • AES-256 & ECDSA Key Inspector │ • Manual MITM Tamper Trigger    │ • Downloadable Audit Cert (JSON)│
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

---

## 4. Red Team Attack Suite

The top navigation bar provides interactive triggers to simulate real-world cyber and physical maritime attacks:

| Attack Vector | Simulation Mechanism | Cryptographic Defense Triggered | Consignee Output |
|---|---|---|---|
| **Trigger MITM Tamper** | Inverts a character in the ciphertext hex payload during transit across the relay. | AES-GCM 128-bit authentication tag verification fails; recalculation of SHA-256 hash fails. | **`INTEGRITY BREACH: HASH MISMATCH AT BLOCK #X (AES-GCM Auth Tag Failure)`** in bright crimson; sirens sound; packet quarantined. |
| **Trigger Replay Attack** | Injects an expired sequence packet ($K \le \text{currentSeq}$) into the stream. | Monotonic sequence validation check. | **`REPLAY DETECTED: Sequence #X is expired or duplicate`**; packet dropped immediately. |
| **Trigger Physical Breach** | Simulates unauthorized opening of the container door at sea by spiking Lux to **924 Lux**. | Decrypted telemetry evaluates light intensity against the hermetic threshold ($>50\text{ Lux}$). | **`PHYSICAL CONTAINER BREACH: CARGO DOOR OPENED (LUX 900+). GEO-COORDINATES FLAGGED ON MARITIME MAP.`** Map pin pulses with crimson emergency beacon. |
| **Reset Voyage** | Reinitializes the voyage. | Generates fresh AES-256 session key & ECDSA keypair; resets genesis hash $0^{64}$ and route. | Reset to Waypoint #1 (Singapore Strait); audio keygen frequency sweep. |

---

## 5. Realistic Maritime Route (Singapore ➔ Mumbai)

The simulation follows **15 authentic maritime waypoints** traversing major international shipping lanes:

1. **Singapore Strait Departure** ($1.2580^\circ\text{N}, 103.8550^\circ\text{E}$) - Eastern fairway
2. **Singapore Strait West Fairway** ($1.2150^\circ\text{N}, 103.6200^\circ\text{E}$) - Raffles Lighthouse TSS
3. **Tanjung Piai / Kukup Deepwater** ($1.3800^\circ\text{N}, 103.1500^\circ\text{E}$) - Southern tip of Asia
4. **Malacca Central / Port Dickson** ($2.1800^\circ\text{N}, 102.0500^\circ\text{E}$) - High-traffic density corridor
5. **Port Klang Gateway Fairway** ($3.0500^\circ\text{N}, 101.1200^\circ\text{E}$) - One Fathom Bank
6. **Penang Channel Approach** ($5.3500^\circ\text{N}, 99.8500^\circ\text{E}$) - Malacca northern exit
7. **Great Channel / Andaman Entry** ($6.2500^\circ\text{N}, 95.1500^\circ\text{E}$) - Deep ocean corridor
8. **South Nicobar Corridor** ($6.5500^\circ\text{N}, 90.8000^\circ\text{E}$) - Bay of Bengal southern artery
9. **Central Indian Ocean Fairway** ($6.2000^\circ\text{N}, 85.5000^\circ\text{E}$) - Equatorial trade route
10. **Dondra Head, Sri Lanka** ($5.8200^\circ\text{N}, 80.5800^\circ\text{E}$) - Pivotal east-west maritime crossroads
11. **Cape Comorin Outer Passage** ($7.4500^\circ\text{N}, 76.9000^\circ\text{E}$) - Rounding Kanyakumari
12. **Kochi Deepwater Corridor** ($9.8500^\circ\text{N}, 75.3500^\circ\text{E}$) - Malabar Coast fairway
13. **Goa Coastal Shipping Channel** ($14.8000^\circ\text{N}, 73.1500^\circ\text{E}$) - Mumbai Port approach sector
14. **Mumbai Outer Anchorage** ($18.7000^\circ\text{N}, 72.6500^\circ\text{E}$) - Pilot boarding station
15. **Port of Mumbai / JNPT Terminal** ($18.9500^\circ\text{N}, 72.9500^\circ\text{E}$) - JNPT container berth

---

## 6. Technology Stack

- **Frontend Core**: React 19, TypeScript 5, Vite 8
- **Styling & Theme**: Tailwind CSS v3 (Matte black `#05070b`, Emerald verified states, Amber transport payloads, Crimson breach alerts)
- **Cryptography**: Pure W3C Web Crypto API (`window.crypto.subtle`) — *Zero external crypto libraries*
- **Geographic Information System**: Leaflet 1.9, React-Leaflet 5 (ESRI World Dark Gray Canvas, ESRI World Imagery Satellite, Cyber Inverted OpenStreetMap)
- **Icons**: Lucide-react
- **Audio Synthesis**: Native Web Audio API procedural synthesis (Sonar pings, Keygen sweeps, Major triad verification chimes, Dual-tone breach alarms)

---

## 7. Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### Installation & Execution
```bash
# Clone the repository
git clone https://github.com/your-username/cargocrypt.git
cd cargocrypt

# Install dependencies
npm install

# Run the development server
npm run dev
```

Navigate to **`http://localhost:5173/`** in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 8. Cryptographic Proof Certificate

CargoCrypt includes an exportable, tamper-evident audit certificate in JSON format containing:
- Genesis Hash & Chain Root
- Hardware Security Module Device Fingerprint & SPKI Public Key
- Block-by-block cryptographic verification log (SHA-256 match, AEAD tag status, ECDSA signature status, monotonic seq verification, timestamped GPS fix)
- Ready for automated ingestion by port authorities, customs agencies, and maritime insurers.

---

*CargoCrypt — Securing the Oceans with Zero-Knowledge Cryptography.*
