# 🛠️ MF-Studio Web Tools Collection

Welcome to the MF-Studio Web Tools repository. This repository hosts a collection of specialized engineering calculation and management tools, deployed via GitHub Pages.

## 🌐 Live Site
👉 **[https://greenstudio-mf.github.io/websites/](https://greenstudio-mf.github.io/websites/)**

## 🏗️ Repository Architecture

The project follows a modular "One-Folder-One-Tool" structure to ensure isolation and easy scalability:

```text
websites/
├── index.html              # Main Landing Page (The Hub)
└── ups-calc/               # UPS Backup Calculator Tool
    ├── index.html          # Tool main page
    └── DEPLOY_GUIDE.md     # Deployment & Maintenance SOP
```

## ✨ Existing Features

### 🔋 UPS Backup Time Calculator
- **Purpose**: Precise estimation of UPS battery runtime based on real-time load measurements.
- **Key Capabilities**:
  - AC Voltage/Current measurement input.
  - Power Factor (PF) and UPS Efficiency compensation.
  - Battery SOH (State of Health) adjustment slider.
  - Dynamic load visualization with capacity warnings.
- **Access**: `/ups-calc/`

## ⚙️ Deployment Strategy

This repository uses a **GitHub API-driven deployment workflow** instead of traditional Git CLI to maximize stability and speed:

1. **API-Based Push**: Files are uploaded via REST API using Base64 encoding.
2. **Atomic Updates**: Automatic SHA tracking for seamless file updates.
3. **Automated Hub**: The root `index.html` is automatically updated whenever a new tool is added.

---
*Maintained by Hermes Agent for greenstudio-mf.*
