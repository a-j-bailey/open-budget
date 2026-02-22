# Privacy Policy — OpenBudget

**Last updated:** February 2026

This privacy policy describes how **OpenBudget** (“the app”) handles your information. The app is designed with a **local-first** approach: your budget data is stored on your device first. Optional features (iCloud sync and analytics) are described below.

---

## 1. Data Stored on Your Device

- **Budget data** — Categories, monthly limits, rules, and expense transactions are stored **locally** on your device in a SQLite database.
- **Preferences** — Settings such as theme and last sync timestamps are stored locally (e.g. AsyncStorage).
- This data **never leaves your device** unless you use the optional features below.

---

## 2. iCloud (Optional)

If you use **iCloud Sync** in the app:

- The app uses **iCloud Documents** (Apple’s Cloud Documents / iCloud Drive) to store a **single snapshot file** in your own iCloud account.
- **What is synced:** One JSON file containing your categories, rules, and expenses, plus a timestamp. The file is stored in the app’s iCloud container: `iCloud.com.magicmirrorcreative.householdbudget`.
- **How it works:** Sync is **manual and optional**. You choose “Push to iCloud” to upload the current snapshot, or “Pull from iCloud” to replace local data with the snapshot (e.g. on a new device).
- **Who has access:** Only **you**, through your Apple ID. The data stays in **your** iCloud account and is subject to **Apple’s Privacy Policy** and iCloud terms. We do not have access to your iCloud data.
- **Requirements:** You must be signed into iCloud and have iCloud Drive enabled. If you disable iCloud or the app’s access, sync will not work; your local data is unchanged.

---

## 3. Vexo Analytics

The app uses **Vexo** (vexo-analytics) for **analytics**.

How Vexo is Used:

- **Purpose:** To understand how the app is used (e.g. app opens, screen views, general usage patterns) and to help improve stability and experience.
- **Data that may be collected:** Usage and diagnostic data such as device type, operating system, session and screen events, and similar technical/usage information. Vexo is designed **not** to store personally identifiable information (PII) from users; it can use device identification (e.g. tokens/hashes) that we can optionally associate with our own records via an “identify device” API — we do not send your name, email, or budget data to Vexo.
- **Control:** You can turn off or limit tracking according to your device and system settings. For more about Vexo’s practices, see [Vexo’s Privacy Policy](https://www.vexo.co/privacy).

---

## 4. What We Do Not Do

- We do **not** collect your name, email, or account credentials for the app itself (other than your use of Apple ID for iCloud, which is between you and Apple).
- We do **not** send your budget, categories, rules, or expense data to our servers or to any third party for advertising or marketing.
- We do **not** sell your data.

---

## 5. Data You Import or Export

- **CSV import:** Files you pick and import are read on your device only; we do not upload them.
- **Export / migration:** Any export or migration of data is done on your device or to destinations you choose (e.g. iCloud). We do not receive or store that data.

---

## 6. Changes to This Policy

We may update this privacy policy from time to time. The “Last updated” date at the top will be revised when we do. Continued use of the app after changes means you accept the updated policy.

---

## 7. Contact

For questions about this privacy policy or OpenBudget’s handling of your data, please contact the developer via the support or contact method provided in the app or on the app’s store listing.