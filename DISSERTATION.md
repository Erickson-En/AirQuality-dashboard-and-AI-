# DESIGN AND IMPLEMENTATION OF AN IoT-BASED AIR QUALITY MONITORING SYSTEM WITH REAL-TIME DASHBOARD AND AI-DRIVEN ANALYTICS

---

## A Dissertation Submitted in Partial Fulfilment of the Requirements for the Award of a Degree

---

**Author:** [Student Name]

**Supervisor:** [Supervisor Name]

**Department:** [Department Name]

**Institution:** [University Name]

**Date:** March 2026

---

## DECLARATION

I hereby declare that this dissertation is my original work and has not been submitted for a degree at any other university. All sources of information have been acknowledged.

**Signature:** ___________________________

**Date:** ___________________________

---

## DEDICATION

*This work is dedicated to all those working towards a cleaner and healthier environment, and to the communities of Nairobi whose air quality inspired this research.*

---

## ACKNOWLEDGEMENTS

I wish to express my sincere gratitude to my supervisor for guidance throughout this research. I am grateful to the Department of [Department Name] for providing the resources and environment necessary for this work. Special thanks to the open-source community whose tools and libraries made this project achievable.

---

## ABSTRACT

Urban air pollution remains one of the most pressing environmental health challenges in developing countries. This dissertation presents the design, implementation, and evaluation of an Internet of Things (IoT)-based air quality monitoring system integrated with a real-time web dashboard and artificial intelligence (AI)-driven analytics. The system employs an Arduino Mega microcontroller interfaced with seven sensors—PMS5003 (PM1.0, PM2.5, PM10), MH-Z19C (CO₂), DHT11 (temperature, humidity), MQ-7 (carbon monoxide), and SGP41 (VOC and NOx indices)—to capture nine distinct environmental parameters. Sensor data is transmitted over GSM/GPRS via a SIM800L module through a TCP proxy to a cloud-hosted Node.js/Express backend, which persists readings in MongoDB and streams updates to connected clients via WebSocket (Socket.IO). The frontend is a React single-page application deployed on Vercel, featuring real-time metric cards, interactive time-series charts, AQI computation based on EPA breakpoints, historical analysis with statistical summaries, and a configurable alert threshold system. An AI analytics pipeline implemented in Python employs scikit-learn's Isolation Forest algorithm for multivariate anomaly detection, with a Z-score fallback for sparse data, alongside moving average forecasting and Pearson correlation analysis. A natural language chatbot provides conversational access to air quality data, health recommendations, trend analysis, and AI predictions. The system was deployed and tested in Nairobi, Kenya, successfully monitoring air quality in real time and demonstrating the feasibility of low-cost, scalable, IoT-enabled environmental monitoring solutions for developing urban contexts.

**Keywords:** Air Quality Monitoring, Internet of Things (IoT), Particulate Matter, Machine Learning, Anomaly Detection, Real-Time Dashboard, Arduino, GSM/GPRS, Isolation Forest, React, Node.js, MongoDB

---

## TABLE OF CONTENTS

1. [Introduction](#chapter-1-introduction)
   - 1.1 Background
   - 1.2 Problem Statement
   - 1.3 Objectives
   - 1.4 Research Questions
   - 1.5 Scope and Limitations
   - 1.6 Significance of the Study
   - 1.7 Organisation of the Dissertation
2. [Literature Review](#chapter-2-literature-review)
   - 2.1 Air Pollution and Public Health
   - 2.2 Air Quality Index (AQI) Standards
   - 2.3 IoT in Environmental Monitoring
   - 2.4 Low-Cost Sensor Technologies
   - 2.5 Machine Learning for Air Quality
   - 2.6 Real-Time Data Visualisation
   - 2.7 Related Work and Gap Analysis
3. [Methodology](#chapter-3-methodology)
   - 3.1 System Architecture Overview
   - 3.2 Hardware Design
   - 3.3 Firmware Development
   - 3.4 Communication and Data Transmission
   - 3.5 Backend Development
   - 3.6 Frontend Development
   - 3.7 AI/ML Analytics Pipeline
   - 3.8 Deployment Strategy
   - 3.9 Testing Approach
4. [System Design and Implementation](#chapter-4-system-design-and-implementation)
   - 4.1 Hardware Layer
   - 4.2 Firmware Layer
   - 4.3 Communication Layer
   - 4.4 Backend Layer
   - 4.5 Database Layer
   - 4.6 Frontend Layer
   - 4.7 AI/ML Layer
   - 4.8 Chatbot Module
5. [Testing and Results](#chapter-5-testing-and-results)
   - 5.1 Hardware Testing
   - 5.2 Communication Testing
   - 5.3 Backend API Testing
   - 5.4 Frontend Validation
   - 5.5 AI/ML Pipeline Validation
   - 5.6 End-to-End Integration Test
   - 5.7 Results and Discussion
6. [Conclusion and Recommendations](#chapter-6-conclusion-and-recommendations)
   - 6.1 Summary of Achievements
   - 6.2 Challenges Encountered
   - 6.3 Recommendations for Future Work
   - 6.4 Conclusion
7. [References](#references)
8. [Appendices](#appendices)

---

## LIST OF FIGURES

- Figure 1.1: Global ambient air pollution – deaths by WHO region
- Figure 3.1: High-level system architecture diagram
- Figure 3.2: Hardware wiring schematic
- Figure 4.1: Sensor node physical assembly
- Figure 4.2: PMS5003 32-byte data frame structure
- Figure 4.3: GSM AT command sequence for HTTP POST
- Figure 4.4: Data transmission pipeline: Arduino → Railway Proxy → Render → MongoDB
- Figure 4.5: MongoDB document schema for sensor readings
- Figure 4.6: Backend REST API endpoint map
- Figure 4.7: Socket.IO real-time event flow
- Figure 4.8: React component hierarchy
- Figure 4.9: FullDashboard — main overview interface
- Figure 4.10: RealTimeData — live monitoring with AQI display
- Figure 4.11: HistoricalData — time-series analysis views
- Figure 4.12: Analytics — AI/ML analytics dashboard
- Figure 4.13: AIChatbot — natural language interface
- Figure 4.14: Isolation Forest anomaly detection decision boundary
- Figure 4.15: Moving average forecasting output
- Figure 5.1: Test sensor data payload and backend response
- Figure 5.2: Real-time metric display with all nine parameters

---

## LIST OF TABLES

- Table 2.1: EPA AQI breakpoints for PM2.5
- Table 2.2: WHO Air Quality Guidelines (2021 revision)
- Table 3.1: Sensor specifications and measurement ranges
- Table 3.2: Arduino pin assignments
- Table 4.1: MongoDB collection schemas
- Table 4.2: REST API endpoints
- Table 4.3: WebSocket event definitions
- Table 4.4: Frontend route mapping
- Table 4.5: Chatbot query categories and trigger keywords
- Table 5.1: End-to-end data latency measurements
- Table 5.2: Anomaly detection performance metrics

---

## LIST OF ABBREVIATIONS

| Abbreviation | Full Form |
|---|---|
| AQI | Air Quality Index |
| API | Application Programming Interface |
| CORS | Cross-Origin Resource Sharing |
| CO | Carbon Monoxide |
| CO₂ | Carbon Dioxide |
| GPRS | General Packet Radio Service |
| GSM | Global System for Mobile Communications |
| HTTP | Hypertext Transfer Protocol |
| I²C | Inter-Integrated Circuit |
| IoT | Internet of Things |
| JSON | JavaScript Object Notation |
| ML | Machine Learning |
| MQTT | Message Queuing Telemetry Transport |
| NOx | Nitrogen Oxides |
| ODM | Object-Document Mapping |
| PM | Particulate Matter |
| REST | Representational State Transfer |
| SPA | Single-Page Application |
| SPI | Serial Peripheral Interface |
| UART | Universal Asynchronous Receiver-Transmitter |
| VOC | Volatile Organic Compounds |
| WHO | World Health Organization |

---

## CHAPTER 1: INTRODUCTION

### 1.1 Background

Air pollution is a global environmental health crisis. According to the World Health Organization (WHO), ambient air pollution causes an estimated 4.2 million premature deaths annually worldwide, with low- and middle-income countries disproportionately affected (WHO, 2022). In Sub-Saharan Africa, rapid urbanisation, industrialisation, vehicular emissions, and household combustion have led to deteriorating air quality in major cities. Nairobi, Kenya, with a population exceeding 4.4 million and a rapidly expanding industrial sector, faces significant air quality challenges with limited monitoring infrastructure.

Traditional air quality monitoring relies on government-operated reference-grade stations that cost between USD 100,000 to USD 500,000 per installation, limiting spatial coverage to a handful of locations per city (Kumar et al., 2015). This scarcity of monitoring points creates "data deserts" where communities remain uninformed about the air they breathe. The emergence of low-cost sensor technologies and Internet of Things (IoT) paradigms has opened new possibilities for ubiquitous, real-time air quality monitoring at a fraction of the cost.

The convergence of affordable microcontrollers (such as Arduino and ESP32), miniaturised air quality sensors (such as laser-scattering particulate matter sensors and electrochemical gas sensors), cellular connectivity (GSM/GPRS), and cloud computing platforms enables the development of comprehensive environmental monitoring systems accessible to researchers, communities, and policymakers in resource-constrained settings.

Furthermore, the integration of artificial intelligence (AI) and machine learning (ML) techniques with sensor data streams enables automated anomaly detection, predictive forecasting, and intelligent health advisories—transforming raw data into actionable insights for public health decision-making.

### 1.2 Problem Statement

Despite growing awareness of air pollution's health impacts, most urban areas in developing countries lack adequate air quality monitoring infrastructure. Existing monitoring stations are expensive, sparse, and often report data with significant delays, making it impossible for citizens to make real-time health-protective decisions. There is a critical need for affordable, scalable, and intelligent air quality monitoring systems that can:

1. Capture multiple pollutant parameters simultaneously using low-cost sensors
2. Transmit data reliably from sensor nodes to cloud infrastructure using widely available cellular networks
3. Present real-time and historical data through intuitive web-based dashboards accessible on any device
4. Apply AI/ML algorithms to detect anomalous pollution events and forecast future air quality trends
5. Provide natural language interfaces for non-technical users to query air quality information

### 1.3 Objectives

**General Objective:**
To design, implement, and evaluate an IoT-based air quality monitoring system with a real-time web dashboard and AI-driven analytics for urban environmental monitoring.

**Specific Objectives:**

1. To design and construct a multi-sensor hardware node capable of measuring nine air quality and environmental parameters: PM1.0, PM2.5, PM10, CO, CO₂, temperature, humidity, VOC index, and NOx index.

2. To develop firmware for the Arduino Mega microcontroller that reads sensor data, displays readings on an LCD, and transmits JSON-formatted data to a cloud backend via GSM/GPRS.

3. To implement a cloud-based backend using Node.js, Express, and MongoDB that receives, persists, and streams sensor data in real time via REST APIs and WebSocket connections.

4. To build a responsive React-based web dashboard featuring real-time metric visualisation, historical data analysis, AQI computation, and configurable alert thresholds.

5. To develop an AI/ML analytics pipeline using Python and scikit-learn that performs anomaly detection (Isolation Forest), time-series forecasting (moving average), and statistical correlation analysis on sensor data streams.

6. To implement a natural language chatbot that enables conversational access to air quality data, health recommendations, and AI-generated insights.

7. To deploy the complete system (frontend on Vercel, backend on Render, proxy on Railway) and validate end-to-end functionality with real sensor data from Nairobi, Kenya.

### 1.4 Research Questions

1. How can low-cost sensors be integrated with an Arduino microcontroller to reliably measure multiple air quality parameters?
2. What is the most effective architecture for transmitting sensor data over GSM/GPRS networks to a cloud backend?
3. How can real-time data visualisation and historical analysis be implemented in a web dashboard to support environmental monitoring?
4. To what extent can machine learning algorithms (specifically Isolation Forest) detect anomalous air quality events from IoT sensor streams?
5. How can natural language processing be applied to make air quality data accessible to non-technical users?

### 1.5 Scope and Limitations

**Scope:**
This project encompasses the full vertical stack of an IoT air quality monitoring system: hardware sensor node design, embedded firmware, cellular communication, cloud backend, web frontend, AI/ML analytics, and natural language chatbot. The system monitors nine parameters: PM1.0, PM2.5, PM10 (particulate matter), CO (carbon monoxide), CO₂ (carbon dioxide), temperature, humidity, VOC index (volatile organic compounds), and NOx index (nitrogen oxides). Deployment and testing were conducted in Nairobi, Kenya.

**Limitations:**

1. **Sensor accuracy**: Low-cost sensors (MQ-7, DHT11) have lower accuracy and higher cross-sensitivity compared to reference-grade instruments. The MQ-7 CO sensor uses a simplified voltage-to-ppm conversion that requires proper calibration for precise readings.
2. **Single node**: The current deployment utilises a single sensor node; network-level spatial analysis is beyond the current scope.
3. **GSM bandwidth**: The SIM800L module is limited to 2G GPRS connectivity, constraining data throughput and requiring a TCP proxy for HTTPS communication.
4. **Forecasting maturity**: The current forecasting module uses a simple moving average algorithm; advanced methods such as ARIMA, Prophet, or LSTM networks are planned as future enhancements.
5. **Power supply**: The sensor node requires continuous mains power; solar or battery operation is not implemented.

### 1.6 Significance of the Study

This study demonstrates the feasibility of building a comprehensive, low-cost air quality monitoring system using commercially available components and open-source software. The significance includes:

1. **Cost-effectiveness**: The total hardware cost of the sensor node (Arduino Mega, sensors, GSM module, display) is under USD 100, compared to USD 100,000+ for reference-grade stations.
2. **Real-time accessibility**: Citizens, health workers, and policymakers can access live air quality data through any web browser.
3. **AI integration**: Automated anomaly detection and forecasting reduce reliance on manual data interpretation.
4. **Reproducibility**: The entire system is open-source (GitHub), enabling replication and adaptation by other researchers and communities.
5. **Local relevance**: Targeted at Nairobi, Kenya, addressing the specific monitoring gaps in East African cities.

### 1.7 Organisation of the Dissertation

This dissertation is organised into six chapters:

- **Chapter 1** introduces the research background, problem statement, objectives, and scope.
- **Chapter 2** reviews relevant literature on air pollution monitoring, IoT technologies, low-cost sensors, and machine learning applications.
- **Chapter 3** describes the methodology, including system architecture, hardware design, software development, and deployment strategies.
- **Chapter 4** details the system design and implementation across all layers: hardware, firmware, communication, backend, database, frontend, AI/ML, and chatbot.
- **Chapter 5** presents testing procedures, results, and discussion.
- **Chapter 6** concludes with a summary of achievements, challenges, and recommendations for future work.

---

## CHAPTER 2: LITERATURE REVIEW

### 2.1 Air Pollution and Public Health

Air pollution is the single largest environmental health risk globally. The WHO estimates that 99% of the global population breathes air exceeding WHO guideline limits, and ambient air pollution contributes to 4.2 million premature deaths annually (WHO, 2022). The health impacts include respiratory diseases (asthma, chronic obstructive pulmonary disease), cardiovascular diseases, stroke, lung cancer, and adverse pregnancy outcomes.

Particulate matter (PM) is the pollutant of greatest health concern. PM2.5 (particles with an aerodynamic diameter ≤ 2.5 µm) can penetrate deep into the lungs and enter the bloodstream, causing systemic inflammation. The Global Burden of Disease Study 2019 identified ambient PM2.5 as the sixth leading risk factor for global mortality (Murray et al., 2020).

In Nairobi, Kenya, air pollution sources include vehicular emissions, industrial activities, construction dust, waste burning, and household biomass combustion. Studies have measured PM2.5 concentrations exceeding 100 µg/m³ in high-traffic areas, well above the WHO annual guideline of 5 µg/m³ and the 24-hour guideline of 15 µg/m³ (deSouza et al., 2017).

### 2.2 Air Quality Index (AQI) Standards

The Air Quality Index (AQI) is a standardised metric for communicating air quality to the public. The United States Environmental Protection Agency (EPA) AQI system, widely adopted internationally, translates pollutant concentrations into a 0–500 scale with six colour-coded categories:

| AQI Range | Category | Health Implications |
|---|---|---|
| 0–50 | Good | Air quality is satisfactory |
| 51–100 | Moderate | Acceptable; moderate concern for sensitive individuals |
| 101–150 | Unhealthy for Sensitive Groups | Members of sensitive groups may experience effects |
| 151–200 | Unhealthy | Everyone may begin to experience effects |
| 201–300 | Very Unhealthy | Health alert; serious effects for everyone |
| 301–500 | Hazardous | Emergency conditions |

The AQI is computed separately for each pollutant (PM2.5, PM10, O₃, CO, NO₂, SO₂) using piecewise linear interpolation between defined breakpoints. The overall AQI is the maximum of individual pollutant AQIs. This project implements the AQI calculation from PM2.5 using the EPA breakpoint table.

### 2.3 IoT in Environmental Monitoring

The Internet of Things (IoT) paradigm enables physical objects embedded with sensors, software, and connectivity to collect and exchange data over the Internet (`Atzori et al., 2010). In environmental monitoring, IoT architectures typically follow a three-tier model:

1. **Perception layer**: Sensors and microcontrollers that capture environmental parameters
2. **Network layer**: Communication technologies (Wi-Fi, Bluetooth, LoRa, cellular, satellite) that transmit data to the cloud
3. **Application layer**: Cloud platforms, databases, analytics engines, and user interfaces that process and present data

GSM/GPRS-based IoT systems are particularly relevant in developing countries where cellular infrastructure is widely available but Wi-Fi coverage is limited. The SIM800L module, used in this project, provides low-cost 2G GPRS connectivity suitable for periodic sensor data transmission.

### 2.4 Low-Cost Sensor Technologies

Low-cost air quality sensors have proliferated in recent years, enabling large-scale monitoring networks. Key sensor technologies relevant to this project include:

**Laser-Scattering Particulate Matter Sensors (PMS5003):**
The Plantower PMS5003 uses a laser to illuminate particles drawn into a sensing chamber, with a photodiode detecting scattered light. It reports PM1.0, PM2.5, and PM10 concentrations in µg/m³ via UART. Studies have demonstrated reasonable agreement (R² > 0.9) with reference instruments under controlled conditions, though humidity can bias readings upward (Zheng et al., 2018).

**Non-Dispersive Infrared (NDIR) CO₂ Sensors (MH-Z19C):**
The Winsen MH-Z19C measures CO₂ concentration (400–5000 ppm) using infrared absorption at the 4.26 µm CO₂ absorption band. NDIR sensors offer good selectivity and long-term stability compared to electrochemical alternatives.

**Metal-Oxide Semiconductor (MOS) Gas Sensors (MQ-7, SGP41):**
The MQ-7 is a tin dioxide-based sensor sensitive to carbon monoxide. It provides an analog voltage proportional to CO concentration, requiring empirical calibration curves. The Sensirion SGP41 is a more advanced multi-pixel metal-oxide sensor providing calibrated VOC and NOx index values (0–500) via I²C, with on-chip algorithms for humidity compensation.

**Capacitive Humidity and Temperature Sensors (DHT11):**
The DHT11 is a low-cost digital sensor measuring temperature (0–50°C, ±2°C accuracy) and relative humidity (20–90% RH, ±5% accuracy). While not research-grade, it provides adequate environmental context for air quality monitoring.

### 2.5 Machine Learning for Air Quality

Machine learning has been extensively applied to air quality data for three primary tasks:

1. **Anomaly detection**: Identifying unusual pollution events that deviate from normal patterns. Isolation Forest (Liu et al., 2008) is an unsupervised algorithm that isolates anomalies by recursively partitioning data with random splits. Anomalies, being few and different, require fewer partitions to isolate and thus have shorter path lengths in the tree structure. It is particularly effective for multivariate sensor data.

2. **Forecasting**: Predicting future pollutant concentrations. Approaches range from simple moving averages and ARIMA models to deep learning methods (LSTM, GRU) and ensemble methods (Random Forests, Gradient Boosting). Donnelly et al. (2015) demonstrated that ensemble methods provide robust short-term PM2.5 forecasts.

3. **Spatial interpolation**: Estimating pollution levels at unmonitored locations using data from sensor networks and geographic features.

### 2.6 Real-Time Data Visualisation

Effective data visualisation is critical for translating sensor data into actionable information. Modern web frameworks (React, Vue.js, Angular) combined with charting libraries (D3.js, Recharts, Chart.js) enable interactive, responsive dashboards. Key visualisation principles for environmental data include:

- **Temporal context**: Time-series line charts with brushable zoom for exploring trends
- **Spatial context**: Maps showing sensor locations and pollutant gradients
- **Status communication**: Colour-coded indicators (AQI categories) for immediate comprehension
- **Statistical summaries**: Min, max, mean, standard deviation, and exceedance counts

WebSocket (Socket.IO) technology enables push-based real-time updates, eliminating the need for periodic polling and providing sub-second data freshness.

### 2.7 Related Work and Gap Analysis

Several related systems have been developed:

- **AirCasting** (HabitatMap, 2013): Open-source platform for crowd-sourced air quality data using mobile sensors. Lacks AI analytics and GSM connectivity.
- **Purple Air** (2017): Network of low-cost PM sensors with cloud dashboard. Limited to PM2.5/PM10; no gas sensors or AI.
- **Smart Citizen Kit** (IAAC, 2012): Arduino-compatible environmental sensing board. Wi-Fi only; not suitable for areas with limited Wi-Fi infrastructure.
- **OpenAQ** (2015): Aggregates government monitoring data from 93 countries. Does not collect data from custom sensors.

**Research Gap**: Existing low-cost air quality systems typically focus on one or two pollutants, use Wi-Fi connectivity (limiting deployment flexibility), and lack integrated AI analytics. No existing system combines: (a) nine-parameter multi-sensor hardware, (b) GSM/GPRS cellular transmission, (c) real-time WebSocket dashboard, (d) multivariate anomaly detection, (e) AI-driven forecasting, and (f) natural language chatbot in a single integrated platform. This project addresses this gap.

---

## CHAPTER 3: METHODOLOGY

### 3.1 System Architecture Overview

The system follows a four-tier IoT architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│  React Dashboard (Vercel) │ AI Chatbot │ Email/SMS Alerts       │
├─────────────────────────────────────────────────────────────────┤
│                     PROCESSING LAYER                            │
│  Node.js/Express Backend (Render) │ Python ML Pipeline          │
│  MongoDB Atlas │ Socket.IO WebSocket                            │
├─────────────────────────────────────────────────────────────────┤
│                     NETWORK LAYER                               │
│  SIM800L GSM/GPRS → Railway TCP Proxy → HTTPS Backend           │
├─────────────────────────────────────────────────────────────────┤
│                     PERCEPTION LAYER                            │
│  Arduino Mega + PMS5003 + MH-Z19C + DHT11 + MQ-7 + SGP41       │
│  + RTC DS3231 + ST7920 LCD Display                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Hardware Design

The sensor node was designed around an Arduino Mega 2560 microcontroller, selected for its four hardware serial ports (required for simultaneous communication with PMS5003, MH-Z19C, and SIM800L) and its 54 digital I/O pins.

**Table 3.1: Sensor Specifications**

| Sensor | Model | Parameter | Range | Interface | Supply |
|---|---|---|---|---|---|
| Particulate Matter | PMS5003 (Plantower) | PM1.0, PM2.5, PM10 | 0–1000 µg/m³ | UART (9600 baud) | 5V |
| Carbon Dioxide | MH-Z19C (Winsen) | CO₂ | 400–5000 ppm | UART (9600 baud) | 5V |
| Temperature/Humidity | DHT11 | Temp, RH | 0–50°C, 20–90% | Single-wire digital | 3.3–5V |
| Carbon Monoxide | MQ-7 | CO | 20–2000 ppm | Analog (0–5V) | 5V |
| VOC/NOx | SGP41 (Sensirion) | VOC Index, NOx Index | 0–500 index | I²C | 3.3V |
| GSM Module | SIM800L | Cellular data | 2G GPRS | UART (9600 baud) | 3.7–4.2V |
| Real-Time Clock | DS3231 | Date/Time | ±2 ppm accuracy | I²C | 3.3–5V |
| Display | ST7920 128×64 LCD | Visual output | 128×64 pixels | Software SPI | 5V |

**Table 3.2: Arduino Mega Pin Assignments**

| Pin | Assignment |
|---|---|
| D7 | DHT11 data |
| A0 | MQ-7 CO sensor (analog) |
| Serial1 (TX1/RX1, D18/D19) | SIM800L GSM module |
| Serial2 (TX2/RX2, D16/D17) | MH-Z19C CO₂ sensor |
| Serial3 (TX3/RX3, D14/D15) | PMS5003 PM sensor |
| D13, D11, D10, D8 | ST7920 LCD (CLK, DATA, CS, RST) |
| SDA (D20), SCL (D21) | SGP41 + RTC DS3231 (I²C bus) |

### 3.3 Firmware Development

The firmware was developed in C/C++ using the Arduino IDE. The main program flow executes in a continuous loop:

1. **Sensor Reading Phase**: All sensors are polled sequentially:
   - PMS5003: Parse 32-byte binary frame from Serial3 (header validation: 0x42, 0x4D)
   - MH-Z19C: Call `myMHZ19.getCO2()` via the MHZ19 library on Serial2
   - SGP41: Execute I²C raw signal measurement, process through VOC/NOx index algorithms (10-second conditioning period on startup)
   - DHT11: Call `dht.readTemperature()` and `dht.readHumidity()`
   - MQ-7: Read analog value from A0, convert to ppm: `(analogRead(A0) × 3.3 / 1023) × 200`

2. **Display Phase**: Cycle through four LCD pages every 4 seconds:
   - Page 0: Particulate Matter (PM1.0, PM2.5, PM10)
   - Page 1: VOC and NOx Index (or "Warming up..." during SGP41 conditioning)
   - Page 2: Environment (Temperature, Humidity, CO, CO₂)
   - Page 3: Air Quality Advice (GOOD / MODERATE / DANGER)

3. **Transmission Phase**: Every 5 minutes (300,000 ms), construct a JSON payload and transmit via GSM:
   ```json
   {
     "location": "Nairobi",
     "metrics": {
       "pm1": 15, "pm25": 23, "pm10": 48,
       "co": 3.45, "co2": 420,
       "temperature": 27.5, "humidity": 65.0,
       "voc_index": 120, "nox_index": 45
     }
   }
   ```

**Arduino Libraries Used:**
- `U8g2lib.h` — ST7920 graphics driver
- `DHT.h` — DHT11/DHT22 sensor interface
- `RTClib.h` — DS3231 real-time clock
- `Wire.h` — I²C bus communication
- `SensirionI2CSgp41.h` — SGP41 sensor driver
- `VOCGasIndexAlgorithm.h` / `NOxGasIndexAlgorithm.h` — Sensirion gas index processing
- `MHZ19.h` — MH-Z19C CO₂ sensor driver

### 3.4 Communication and Data Transmission

The SIM800L GSM module communicates with the backend through the following sequence of AT commands:

**Initialisation:**
```
AT              → Module attention check
ATE0            → Disable echo
AT+CPIN?        → Verify SIM card status (expect "READY")
AT+CSQ          → Check signal strength (0–31 scale)
AT+CREG?        → Network registration (expect 0,1 or 0,5)
AT+CGATT=1      → Attach to GPRS service
AT+SAPBR=3,1,"CONTYPE","GPRS"  → Set bearer to GPRS
AT+SAPBR=3,1,"APN","safaricom" → Configure APN
AT+SAPBR=1,1    → Open GPRS bearer (may take 30–60 seconds)
AT+SAPBR=2,1    → Query bearer status (verify valid IP assigned)
AT+HTTPINIT     → Initialise HTTP service
AT+HTTPPARA="CID",1  → Associate HTTP with bearer profile
```

**Data Transmission:**
```
AT+HTTPPARA="URL","http://yamanote.proxy.rlwy.net:45265/api/sensor-data"
AT+HTTPPARA="CONTENT","application/json"
AT+HTTPDATA=<length>,10000  → Prepare to upload JSON body
<JSON payload>              → Send JSON data
AT+HTTPACTION=1             → Execute HTTP POST
AT+HTTPREAD                 → Read server response
AT+HTTPTERM                 → Terminate HTTP session
```

**Proxy Architecture:**
The SIM800L module cannot perform HTTPS/TLS natively. A Railway TCP proxy (`yamanote.proxy.rlwy.net:45265`) accepts plain HTTP from the Arduino and forwards the request to the HTTPS-secured Render backend:

```
Arduino → HTTP → Railway TCP Proxy → HTTPS → Render Backend
```

### 3.5 Backend Development

The backend was developed using Node.js with the Express framework, following a monolithic architecture suitable for the project's scale. Key design decisions included:

- **Express 5.1** for HTTP request handling and middleware pipeline
- **Mongoose 8.x** as the MongoDB Object-Document Mapper (ODM)
- **Socket.IO 4.x** for real-time WebSocket communication
- **CORS** configured with origin whitelisting for security while allowing requests from Arduino/GSM (no origin header)
- **In-memory caching** for the latest reading and a history buffer of up to 2,000 readings to reduce database queries

### 3.6 Frontend Development

The frontend was built as a React Single-Page Application (SPA) using Create React App, with the following design principles:

- **Component-based architecture** with reusable MetricCard, Layout, Sidebar, and Header components
- **Real-time updates** via Socket.IO client, eliminating polling overhead
- **Responsive design** using CSS Grid and Flexbox
- **Interactive charting** with Recharts library supporting line, area, bar, pie, radar, and composed chart types
- **Client-side routing** with React Router for navigation between dashboard views
- **Dual theming** (Industrial and Cyber themes) persisted in localStorage

### 3.7 AI/ML Analytics Pipeline

The analytics pipeline was implemented in Python, operating independently of the Node.js backend and accessing the shared MongoDB database directly:

1. **Anomaly Detection**: scikit-learn's Isolation Forest with 200 estimators, processing multivariate sensor features. A Z-score fallback (threshold: |z| ≥ 3.0) handles edge cases with fewer than 50 data points.
2. **Forecasting**: Simple moving average over the last 20 readings, projected for 12 future intervals.
3. **Statistical Summarisation**: Min, max, mean, and count aggregation stored in dedicated MongoDB collections.
4. **Alert Dispatch**: Multi-channel alerting via SMTP email, Twilio SMS, and backend webhook POST.

### 3.8 Deployment Strategy

A cloud-native deployment strategy was adopted:

| Component | Platform | URL/Address |
|---|---|---|
| Frontend (React SPA) | Vercel | `https://air-quality-dashboard-and-ai.vercel.app` |
| Backend (Node.js/Express) | Render | `https://backend-air-quality.onrender.com` |
| HTTP-to-HTTPS Proxy | Railway | `yamanote.proxy.rlwy.net:45265` |
| Database | MongoDB Atlas | Cloud-hosted MongoDB cluster |

### 3.9 Testing Approach

Testing was conducted at multiple levels:

1. **Unit testing**: Individual sensor readings verified against known concentrations
2. **Integration testing**: End-to-end data flow from Arduino POST through proxy, backend, database, and WebSocket emission
3. **API testing**: A dedicated test script (`test_backend.js`) validates health check, sensor data POST, and latest reading retrieval
4. **Frontend validation**: Visual verification of metric cards, charts, and real-time updates across all dashboard pages

---

## CHAPTER 4: SYSTEM DESIGN AND IMPLEMENTATION

### 4.1 Hardware Layer

The sensor node integrates seven sensor modules with an Arduino Mega 2560 microcontroller. The physical assembly connects sensors via a combination of UART, I²C, analog, and digital interfaces as specified in Table 3.2.

The PMS5003 particulate matter sensor operates on a laser-scattering principle, drawing ambient air through a fan-driven inlet. It outputs 32-byte binary frames at 9600 baud with the following structure:

| Byte Positions | Content |
|---|---|
| 0–1 | Start characters: 0x42, 0x4D |
| 2–3 | Frame length |
| 4–5 | PM1.0 (CF=1, standard particle) |
| 6–7 | PM2.5 (CF=1) |
| 8–9 | PM10 (CF=1) |
| 10–11 | PM1.0 (atmospheric environment) |
| 12–13 | PM2.5 (atmospheric environment) |
| 14–15 | PM10 (atmospheric environment) |
| 28–29 | Check code |

The firmware reads atmospheric environment values (bytes 10–15) for PM1.0, PM2.5, and PM10.

The SGP41 sensor requires a 10-second conditioning period after power-on, during which `executeConditioning()` is called. After conditioning, `measureRawSignals()` provides raw VOC and NOx signals that are processed through Sensirion's proprietary gas index algorithms (`VOCGasIndexAlgorithm` and `NOxGasIndexAlgorithm`) to produce normalised index values on a 0–500 scale.

### 4.2 Firmware Layer

The firmware implements a state machine within the Arduino `loop()` function, executing at approximately 100 ms intervals (controlled by `delay(100)`). The display implements a page-cycling mechanism with a 4-second interval per page, providing continuous visual feedback during field deployment.

A critical guard clause prevents data transmission when all sensor readings are zero (indicating sensors have not yet stabilised):
```cpp
if (pm2_5 == 0 && pm10 == 0 && temperature == 0.0 && humidity == 0.0 && co2_ppm == 0) {
    Serial.println(F("⚠ Skipping send: sensor readings not ready (all zero)"));
    return;
}
```

The air quality advice page provides immediate on-device health guidance:
- **GOOD**: CO < 9 ppm AND PM2.5 < 35 µg/m³ AND VOC < 150 AND CO₂ < 1000 ppm
- **DANGER**: CO > 35 ppm OR VOC > 300 OR PM2.5 > 75 µg/m³ OR CO₂ > 1500 ppm
- **MODERATE**: All intermediate conditions

### 4.3 Communication Layer

The GSM communication implements robust error handling:

1. **Bearer status checking** before each transmission (verifying the IP address is not 0.0.0.0)
2. **HTTP status code parsing** from `+HTTPACTION:` response to detect 200/201 success, 301 redirects, or error codes
3. **Network registration verification** (`AT+CREG?` expecting `0,1` for home network or `0,5` for roaming)
4. **GPRS attachment check** (`AT+CGATT?`) with automatic attachment attempt if disconnected

The HTTP proxy server deployed on Railway (`http-proxy-server.js`) uses Node.js with the axios library to forward requests:
```javascript
// Proxy receives HTTP POST from Arduino
app.post('/api/sensor-data', async (req, res) => {
    // Forward to HTTPS backend with 30-second timeout
    const response = await axios.post(TARGET_URL + '/api/sensor-data', req.body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
    });
    res.status(response.status).json(response.data);
});
```

### 4.4 Backend Layer

The backend is a monolithic Express application (`Server.js`, 264 lines) implementing the following key systems:

**A. Data Ingestion:**
Two equivalent endpoints accept sensor data:
- `POST /api/sensor-data` — primary endpoint
- `POST /api/airdata` — alias for backward compatibility

Both endpoints validate the payload (rejecting empty, non-object, or metrics-less requests), save to MongoDB via Mongoose, update the in-memory cache, emit a Socket.IO event, and run the alert engine.

**B. Real-Time Alert Engine:**
The alert engine evaluates every incoming reading against predefined thresholds:
```javascript
const thresholds = { pm1: 50, pm25: 150, pm10: 150, co: 10, co2: 1000, o3: 100, no2: 100 };
```
When a metric exceeds its threshold, an Alert document is created in MongoDB with severity `"unhealthy"`, and an `"alert"` event is emitted via Socket.IO to all connected frontends.

**C. API Endpoints (22 total):**

| Category | Endpoints | Count |
|---|---|---|
| Sensor Data Ingestion | POST sensor-data, POST airdata | 2 |
| Latest Data Retrieval | GET sensor-data/latest, GET airdata/latest | 2 |
| Historical Data | GET /api/historical | 1 |
| Authentication | POST auth/signup, POST auth/login | 2 |
| Analytics/ML | GET anomalies, summary/latest, summary/all, forecast/latest, forecast/all, health-score, correlations, trends | 8 |
| Alerts | GET /api/alerts | 1 |
| Settings | POST /api/settings, GET /api/settings/:userId | 2 |
| Chatbot | POST /api/chatbot/query | 1 |
| Health Check | GET /health | 1 |
| Readings (router) | GET /api/readings | 1 |
| **Total** | | **21** |

### 4.5 Database Layer

MongoDB was selected for its schema flexibility (accommodating varying sensor configurations), native JSON document model (matching the sensor payload format), and horizontal scalability. Six collections are used:

| Collection | Purpose | Document Count (typical) |
|---|---|---|
| `readings` | Raw sensor data | Grows continuously (~288/day at 5-min intervals) |
| `alerts` | Threshold violation records | Event-driven |
| `users` | Authentication credentials | Static |
| `settings` | User alert configurations | 1 per user |
| `analytics_anomalies` | ML-detected anomalies | Per pipeline run |
| `analytics_forecast` | ML forecast projections | Per pipeline run |
| `analytics_summary` | Statistical summaries | Per pipeline run |

The Reading schema stores all nine sensor parameters within a nested `metrics` sub-document, preserving the JSON structure from the Arduino payload.

### 4.6 Frontend Layer

The React frontend implements a six-page architecture within a persistent Layout shell (Sidebar + Header):

**A. FullDashboard (Main Overview):**
- Severity-based metric cards with gradient colouring (GOOD → HAZARDOUS)
- Overall air quality status banner with pollutant-level exceedance reporting
- Real-time Socket.IO updates on page load

**B. RealTimeData (Live Monitoring):**
- WebSocket connection status indicator with pulsing animation
- EPA-standard AQI computation and display banner with category icon
- Nine metric cards with per-session trend arrows
- Threshold alert notifications (stored in component state, last 5 alerts)
- Session statistics panel (min, max, avg, current per metric)
- Interactive charts (Line/Area toggle) with Brush and Zoom for last 50 readings
- CSV and JSON data export functionality
- Auto-refresh pause/resume control

**C. HistoricalData (Time-Series Analysis):**
- Timeframe filters: 5 minutes, 24 hours, 7 days, 30 days
- Custom date range picker with datetime-local inputs
- Three view modes: Grid (individual charts), Combined (multi-metric overlay), Table (HTML with threshold highlighting)
- Statistical summary per metric: min, max, mean, median, standard deviation, exceedance count/percentage
- Threshold reference lines (toggleable)

**D. Analytics (AI/ML Dashboard):**
- Health Score: Weighted composite score (0–100) based on WHO thresholds, displayed with RadarChart comparison
- Trend Analysis: Linear regression per metric (slope, direction, percentage change)
- AI Predictions: Moving average extrapolation with confidence percentage
- Correlations: Pearson correlation coefficients between all metric pairs
- ML Forecast Chart: AreaChart of predicted values
- Anomaly Detection Cards: Z-score severity, mean (μ), std (σ), sensor identification
- Historical overview: ComposedChart, BarChart of averages, PieChart of pollutant distribution

**E. Settings (Configuration):**
- Configurable alert thresholds for all nine parameters
- Persisted to backend via REST API

**F. AIChatbot (Natural Language Interface):**
- Floating overlay accessible from any page
- Six quick-action buttons for common queries
- Chat-style interface with typing indicators
- Handles 10 query categories (current conditions, health, outdoor, PM2.5, temperature, CO, trends, forecasts, anomalies, statistics)

### 4.7 AI/ML Layer

**A. Isolation Forest Anomaly Detection:**

The Isolation Forest algorithm (Liu et al., 2008) detects multivariate anomalies in sensor data. The implementation uses scikit-learn with the following configuration:
```python
from sklearn.ensemble import IsolationForest
model = IsolationForest(n_estimators=200, contamination='auto', random_state=42)
```

The detector operates on a 15-minute rolling window of sensor readings. Each reading is flattened from the nested MongoDB document structure into a feature vector containing all available metrics (pm25, pm10, co, o3, no2, temperature, humidity, pressure, light). The model's `decision_function()` produces an anomaly score; readings with scores below -0.2 are classified as anomalous.

When insufficient samples are available (fewer than 50), a univariate Z-score method serves as a fallback:
```python
z_score = abs((value - mean) / std)
if z_score >= 3.0:
    # Flag as anomaly
```

**B. Moving Average Forecasting:**

The current forecasting module implements a simple moving average (SMA) baseline:
```python
window = values[-20:]  # Last 20 readings
ma = sum(window) / len(window)
forecast = [{"step": i+1, "forecast_value": ma} for i in range(FORECAST_HORIZON)]
```

This provides a naive baseline for short-term predictions. The architecture supports future integration of ARIMA, Prophet, or LSTM models.

**C. Multi-Channel Alert Dispatch:**

Detected anomalies trigger a multi-channel alert system:
1. **SMTP Email**: Formatted alert sent via TLS-secured SMTP (port 587)
2. **Twilio SMS**: 160-character alert message to configured phone number
3. **Backend Webhook**: HTTP POST to the backend API for frontend notification

### 4.8 Chatbot Module

The chatbot processes natural language queries through keyword matching against 10 categories:

| Category | Trigger Keywords | Data Sources |
|---|---|---|
| Current Conditions | "current", "now", "today" | Latest Reading (metrics.*) |
| Health/Safety | "safe", "health", "recommend" | AQI → Health Recommendations |
| Outdoor Activity | "outdoor", "exercise", "run" | AQI threshold (≤100 = safe) |
| PM2.5 Specific | "pm2.5", "pm 2.5" | metrics.pm25 |
| Temperature | "temperature", "temp", "hot" | metrics.temperature, metrics.humidity |
| Carbon Monoxide | "co", "carbon monoxide" | metrics.co (threshold: 9 ppm) |
| Trends | "trend", "getting better" | Last 24h AQI comparison |
| Forecasts | "forecast", "predict" | analytics_forecast collection |
| Anomalies | "alert", "anomaly" | analytics_anomalies collection |
| Statistics | "average", "stats" | analytics_summary collection |

Health recommendations are tiered across six AQI levels, each providing:
- Category label and colour
- Health advice text
- Recommended activities list
- Precautions list

---

## CHAPTER 5: TESTING AND RESULTS

### 5.1 Hardware Testing

Each sensor was individually tested upon connection to the Arduino:

- **PMS5003**: Verified by checking for valid frame headers (0x42, 0x4D) and non-zero PM values on the Serial Monitor
- **MH-Z19C**: Verified by reading CO₂ values (expected ~400 ppm in well-ventilated room)
- **DHT11**: Verified by comparing readings with a reference thermometer/hygrometer
- **MQ-7**: Verified by observing voltage response to controlled CO exposure
- **SGP41**: Verified by confirming 10-second conditioning countdown and subsequent VOC/NOx index output
- **RTC DS3231**: Verified by setting time and confirming display accuracy
- **ST7920 LCD**: Verified by cycling through all four display pages

### 5.2 Communication Testing

GSM connectivity was tested using the `gsm_test_simple.ino` sketch, which:
1. Initialises the SIM800L module
2. Verifies SIM card registration (`AT+CPIN?`)
3. Checks signal strength (`AT+CSQ`)
4. Opens a GPRS bearer
5. Sends a test HTTP POST with simulated sensor data
6. Verifies the server response (HTTP 200)

### 5.3 Backend API Testing

The `test_backend.js` script validates three critical endpoints:

**Test 1 — Health Check:**
```
GET /health → Expected: 200 { "status": "ok" }
```

**Test 2 — Sensor Data Ingestion:**
```
POST /api/sensor-data
Body: {
  "location": "Test Lab",
  "metrics": {
    "pm1": 18.3, "pm25": 25.5, "pm10": 50.2,
    "co": 3.8, "co2": 420, "o3": 30.5, "no2": 15.2,
    "temperature": 27.5, "humidity": 65.0,
    "voc_index": 120, "nox_index": 45
  }
}
Expected: 200 { "success": true }
```

**Test 3 — Latest Reading Retrieval:**
```
GET /api/sensor-data/latest → Expected: 200 with all 9 metrics present
```

All three tests were executed successfully against both the local development server and the deployed Render backend.

### 5.4 Frontend Validation

The frontend was validated by:
1. Sending test data through the Railway proxy and verifying all nine metric cards displayed correct values on the FullDashboard
2. Confirming Socket.IO real-time updates appeared within 1 second of data POST
3. Verifying historical data charts populated correctly with multiple timeframe selections
4. Testing the chatbot with all 10 query categories and confirming accurate responses
5. Confirming AQI calculation matched manual EPA breakpoint computation

### 5.5 AI/ML Pipeline Validation

The anomaly detection module was validated by:
1. Injecting normal sensor readings (PM2.5 = 20–30 µg/m³) and confirming no anomalies flagged
2. Injecting an extreme reading (PM2.5 = 500 µg/m³) and confirming the Isolation Forest and Z-score methods both detected the anomaly
3. Verifying anomaly documents were correctly stored in the `analytics_anomalies` MongoDB collection
4. Confirming forecast output produced 12-step projections consistent with recent moving averages

### 5.6 End-to-End Integration Test

A complete end-to-end test was performed using the full data path:

```
Arduino (sensors) → SIM800L (GPRS) → Railway Proxy (HTTP)
→ Render Backend (HTTPS) → MongoDB (persist)
→ Socket.IO (emit) → React Dashboard (display)
```

Test data with all nine metrics was transmitted successfully, with the following verified outcomes:
- Backend returned HTTP 200 with `{ "success": true }`
- MongoDB document contained all nine metric fields with correct values
- Socket.IO `"sensorData"` event delivered the normalised reading to connected frontends
- FullDashboard and RealTimeData pages displayed all metric cards with correct values and units
- PM1.0 and CO₂ values (previously missing) appeared correctly after the code fixes

### 5.7 Results and Discussion

The system successfully demonstrated:

1. **Multi-parameter monitoring**: All nine environmental parameters were captured simultaneously from five distinct sensor types, transmitted via GSM/GPRS, and displayed in real time on the web dashboard.

2. **Reliable GSM transmission**: The 5-minute transmission interval provided a balance between data granularity and cellular data cost. The Railway proxy effectively bridged the SIM800L's HTTP limitation with the Render backend's HTTPS requirement.

3. **Real-time visualisation**: Socket.IO provided sub-second latency for data updates. The interactive charts (Recharts) enabled users to explore trends, zoom into specific time ranges, and compare multiple metrics simultaneously.

4. **AI-driven anomaly detection**: The Isolation Forest algorithm successfully identified outlier readings in multivariate sensor data. The Z-score fallback ensured anomaly detection remained functional during the initial data collection phase when insufficient samples were available for the full model.

5. **Natural language accessibility**: The chatbot provided conversational access to air quality data for all 10 query categories, making technical environmental data accessible to non-specialist users.

6. **AQI computation**: The EPA-standard AQI calculation from PM2.5 provided a universally understood air quality metric, with colour-coded categories enabling immediate comprehension of health implications.

---

## CHAPTER 6: CONCLUSION AND RECOMMENDATIONS

### 6.1 Summary of Achievements

This project successfully designed, implemented, and deployed a complete IoT-based air quality monitoring system comprising:

1. **A multi-sensor hardware node** integrating seven sensor modules (PMS5003, MH-Z19C, DHT11, MQ-7, SGP41, DS3231, ST7920) with an Arduino Mega, measuring nine environmental parameters with on-device display and GSM/GPRS connectivity.

2. **A cloud backend** (Node.js/Express/MongoDB) with 21 REST API endpoints, real-time WebSocket streaming, an automated alert engine, and user authentication.

3. **A responsive web dashboard** (React/Recharts) with five specialised views: overview dashboard, real-time monitoring with AQI display, historical analysis with statistical summaries, AI/ML analytics with anomaly detection and forecasting, and configurable alert settings.

4. **An AI/ML analytics pipeline** (Python/scikit-learn) performing Isolation Forest anomaly detection, moving average forecasting, and multi-channel alert dispatch.

5. **A natural language chatbot** handling 10 categories of air quality queries with health-tiered recommendations.

6. **A production deployment** on Vercel (frontend), Render (backend), Railway (proxy), and MongoDB Atlas (database), accessible at `https://air-quality-dashboard-and-ai.vercel.app`.

All seven specific objectives outlined in Section 1.3 were achieved.

### 6.2 Challenges Encountered

1. **HTTPS limitation of SIM800L**: The GSM module's inability to perform TLS/SSL handshakes required the implementation of a dedicated HTTP-to-HTTPS proxy on Railway, adding architectural complexity.

2. **CORS configuration**: Cross-origin requests between Vercel-hosted frontend, Render-hosted backend, and various preview deployment URLs required careful origin whitelisting with `startsWith()` matching.

3. **Data schema consistency**: Ensuring the chatbot accessed sensor data through the correct nested path (`reading.metrics.pm25` vs. `reading.pm25`) required careful debugging across all query handlers.

4. **GSM reliability**: GPRS connections via SIM800L were occasionally unstable, requiring bearer status checks, connection retry logic, and guard clauses against transmitting zero readings.

5. **Sensor calibration**: The MQ-7 CO sensor's simplified voltage-to-ppm conversion provides approximate readings; production deployment would require multi-point calibration against reference instruments.

### 6.3 Recommendations for Future Work

1. **Advanced forecasting models**: Replace the simple moving average with ARIMA, Facebook Prophet, or LSTM neural networks for more accurate multi-step predictions.

2. **Multi-node sensor network**: Deploy multiple sensor nodes across different locations to enable spatial interpolation and pollutant dispersion mapping.

3. **Edge computing**: Implement on-device anomaly detection using TinyML (TensorFlow Lite for Microcontrollers) to reduce cloud dependency and enable offline alerts.

4. **Solar power**: Design a solar-powered enclosure with battery backup for autonomous outdoor deployment.

5. **4G/LTE upgrade**: Replace the SIM800L (2G) with a SIM7600 (4G LTE) module, eliminating the need for the HTTP proxy and enabling faster data transmission.

6. **Sensor fusion and calibration**: Implement machine learning-based sensor calibration using co-location with reference instruments to improve measurement accuracy.

7. **Mobile application**: Develop a React Native mobile application with push notifications for air quality alerts.

8. **MQTT protocol**: Migrate from HTTP POST to MQTT for more efficient IoT communication with lower overhead and built-in QoS levels.

9. **Spatial visualisation**: Integrate mapping (Leaflet.js or Mapbox) to display sensor locations and interpolated pollutant heatmaps.

10. **Community participation**: Develop community engagement features allowing citizens to report pollution sources and access localised health recommendations.

### 6.4 Conclusion

This dissertation has demonstrated that a comprehensive, low-cost air quality monitoring system can be built using commercially available sensors, open-source microcontrollers, cellular connectivity, and cloud platforms at a fraction of the cost of traditional monitoring infrastructure. The integration of real-time visualisation, machine learning analytics, and natural language interfaces transforms raw sensor data into actionable health information.

The system addresses a critical need in developing urban areas where air quality monitoring infrastructure is sparse or absent. By making all hardware designs, firmware, and software open-source, this project enables replication and adaptation by researchers, environmental organisations, and public health agencies worldwide.

As low-cost sensor technology continues to mature and cellular IoT connectivity becomes ubiquitous, systems like the one presented in this dissertation will play an increasingly important role in democratising environmental monitoring and empowering communities to make informed decisions about the air they breathe.

---

## REFERENCES

Atzori, L., Iera, A. and Morabito, G. (2010) 'The Internet of Things: A survey', *Computer Networks*, 54(15), pp. 2787–2805.

deSouza, P., Nthusi, V., Klopp, J.M., Shaw, B.E., Ho, W.O., Saffell, J., Jones, R. and Ratti, C. (2017) 'A Nairobi experiment in using low cost air quality monitors', *Clean Air Journal*, 27(2), pp. 12–42.

Donnelly, A., Misstear, B. and Broderick, B. (2015) 'Real time air quality forecasting using integrated parametric and non-parametric regression techniques', *Atmospheric Environment*, 103, pp. 53–65.

Kumar, P., Morawska, L., Martani, C., Biskos, G., Neophytou, M., Di Sabatino, S., Bell, M., Norford, L. and Britter, R. (2015) 'The rise of low-cost sensing for managing air pollution in cities', *Environment International*, 75, pp. 199–205.

Liu, F.T., Ting, K.M. and Zhou, Z.H. (2008) 'Isolation Forest', *Proceedings of the 8th IEEE International Conference on Data Mining*, pp. 413–422.

Murray, C.J.L. et al. (2020) 'Global burden of 87 risk factors in 204 countries and territories, 1990–2019: a systematic analysis for the Global Burden of Disease Study 2019', *The Lancet*, 396(10258), pp. 1223–1249.

Plantower (2016) *PMS5003 Digital Universal Particle Concentration Sensor Datasheet*. Version 2.3.

Sensirion (2021) *SGP41 Datasheet: Indoor Air Quality Sensor for VOC and NOx Measurements*. Version 0.6.

United States Environmental Protection Agency (2018) *Technical Assistance Document for the Reporting of Daily Air Quality – the Air Quality Index (AQI)*. EPA 454/B-18-007.

Winsen (2020) *MH-Z19C NDIR CO₂ Module Datasheet*. Version 1.0.

World Health Organization (2021) *WHO Global Air Quality Guidelines: Particulate Matter (PM2.5 and PM10), Ozone, Nitrogen Dioxide, Sulfur Dioxide and Carbon Monoxide*. Geneva: WHO.

World Health Organization (2022) *Ambient (Outdoor) Air Pollution*. Fact Sheet. Available at: https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health

Zheng, T., Bergin, M.H., Johnson, K.K., Tripathi, S.N., Shiber, S., Mukhopadhyay, K., Dey, S., Berman, E. and Clark, N. (2018) 'Field evaluation of low-cost particulate matter sensors in high- and low-concentration environments', *Atmospheric Measurement Techniques*, 11(8), pp. 4823–4846.

---

## APPENDICES

### Appendix A: Arduino Firmware — integrated_gsm_sender.ino

The complete firmware source code for the production sensor node is available in the project repository:
- **Repository**: https://github.com/Erickson-En/AirQuality-dashboard-and-AI-
- **File**: `arduino/integrated_gsm_sender.ino`
- **Lines of code**: 525

### Appendix B: Backend Source Code

The complete backend source code is available at:
- **Repository**: https://github.com/Erickson-En/Backend-Air-Quality
- **Primary files**: `Server.js` (264 lines), `routes/chatbot.js` (316 lines), `routes/analytics.js`, `models/reading.js`

### Appendix C: Frontend Source Code

The complete frontend source code is available in the dashboard repository:
- **Repository**: https://github.com/Erickson-En/AirQuality-dashboard-and-AI-
- **Primary files**: `src/pages/RealTimeData.js` (602 lines), `src/pages/HistoricalData.js` (597 lines), `src/pages/Analytics.js`, `src/pages/FullDashboard.js`

### Appendix D: ML Analytics Pipeline

The machine learning pipeline source code:
- **Directory**: `ml/`
- **Anomaly detection**: `ml/anomaly/detector.py`
- **Forecasting**: `ml/analytics/forecast.py`
- **Pipeline orchestration**: `ml/analytics/pipeline.py`

### Appendix E: Circuit Wiring Diagram

*[Insert hardware wiring diagram here]*

### Appendix F: Sample JSON Payloads

**Sensor Data POST Payload:**
```json
{
  "location": "Nairobi",
  "metrics": {
    "pm1": 15,
    "pm25": 23,
    "pm10": 48,
    "co": 3.45,
    "co2": 420,
    "temperature": 27.5,
    "humidity": 65.0,
    "voc_index": 120,
    "nox_index": 45
  }
}
```

**Backend Response:**
```json
{
  "success": true
}
```

**MongoDB Reading Document:**
```json
{
  "_id": "ObjectId('...')",
  "timestamp": "2026-03-04T10:30:00.000Z",
  "location": "Nairobi",
  "metrics": {
    "pm1": 15,
    "pm25": 23,
    "pm10": 48,
    "co": 3.45,
    "co2": 420,
    "temperature": 27.5,
    "humidity": 65.0,
    "voc_index": 120,
    "nox_index": 45
  },
  "__v": 0
}
```

**Socket.IO "sensorData" Event Payload:**
```json
{
  "_id": "ObjectId('...')",
  "timestamp": "2026-03-04T10:30:00.000Z",
  "location": "Nairobi",
  "metrics": {
    "pm1": 15,
    "pm25": 23,
    "pm10": 48,
    "co": 3.45,
    "co2": 420,
    "temperature": 27.5,
    "humidity": 65.0,
    "voc_index": 120,
    "nox_index": 45
  }
}
```

### Appendix G: Deployment URLs

| Component | URL |
|---|---|
| Live Dashboard | https://air-quality-dashboard-and-ai.vercel.app |
| Backend API | https://backend-air-quality.onrender.com |
| Backend Health | https://backend-air-quality.onrender.com/health |
| Railway Proxy | http://yamanote.proxy.rlwy.net:45265 |
| Frontend Repo | https://github.com/Erickson-En/AirQuality-dashboard-and-AI- |
| Backend Repo | https://github.com/Erickson-En/Backend-Air-Quality |
