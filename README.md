
# Searay Shopify Theme — GitHub Source of Truth

This repository is the **official source of truth** for the live Shopify theme used on:

Store: for-discovery.myshopify.com  
Theme (LIVE): Task 5a, task line 19, task line 25  
Theme ID: 147360776345

> Shopify Admin is NOT the source of truth. GitHub is.

---

## Why this repo exists

We previously edited theme code directly in Shopify Admin.  
After a Dawn theme update, **all Theme Editor customizations were lost**.

This repo prevents that from ever happening again by versioning:

- config/settings_data.json (Theme Editor settings)
- templates/*.json
- All Liquid / JS / CSS customizations

---

## Required tools

- Shopify CLI v3
- VS Code
- Git

---

## Daily development workflow

### 1) Always pull latest LIVE before starting work

shopify theme pull --store=for-discovery.myshopify.com --theme=147360776345

### 2) Run local dev preview (auto refresh)

shopify theme dev --store=for-discovery.myshopify.com

### 3) Commit changes to GitHub

git add .
git commit -m "Describe the change"
git push

### 4) Push to an UNPUBLISHED theme for testing (recommended)

shopify theme push --store=for-discovery.myshopify.com --theme=<unpublished_theme_id>

Preview → Publish in Shopify when safe.

---

## Emergency restore (if Shopify breaks again)

If theme gets corrupted or Dawn update wipes settings:

shopify theme push --store=for-discovery.myshopify.com --theme=147360776345

Everything (including Theme Editor settings) is restored.

---

## Important files you must never delete

These contain Theme Editor customizations:

- config/settings_data.json
- templates/*.json

---

## Backorder email integration (SECURITY FIX)

Previously, the theme directly called an Azure Function with a secret key.

This was public in page source and unsafe.

### New approach (safe)

Theme now calls:

const endpoint = "/apps/backorder";

This uses Shopify App Proxy or a backend endpoint so that:

Shopify Theme (public)
        ↓
/apps/backorder (no secret)
        ↓
Your backend / app proxy
        ↓
Azure Function (secret stored server-side)

---

## Rules

❌ Do NOT edit theme in Shopify code editor  
❌ Do NOT hardcode API keys in Liquid/JS  
❌ Do NOT publish changes without Git commit  

✅ Always work from this repo  
✅ Always pull before editing  
✅ Always push to test theme first  

---

## Summary

This repo ensures:

- No more lost customizations
- Safe theme upgrades
- Proper backup & restore
- Secure API architecture
- Professional Shopify development workflow
