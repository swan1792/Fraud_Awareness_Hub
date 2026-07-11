---
name: myanmar-format
description: Format Myanmar-specific data — phone numbers, currency (MMK), names, dates, and addresses — for display in the Fraud Awareness Hub
---

# Myanmar Format

Use this skill when formatting Myanmar-specific content for display in the frontend or storing in the database.

## When to Use

- Displaying Myanmar Kyat (MMK) amounts
- Formatting Myanmar phone numbers (09XXXXXXXXX)
- Showing Myanmar names in proper order
- Displaying dates in Myanmar conventions
- Rendering Burmese text correctly

## Currency (MMK)

### Display Format

```javascript
// Use Intl.NumberFormat for consistent formatting
const formatMMK = (amount) =>
  new Intl.NumberFormat('en-US').format(amount) + ' MMK'

formatMMK(500000)   // "500,000 MMK"
formatMMK(1000)     // "1,000 MMK"
formatMMK(999)      // "999 MMK"
```

### Rules

- Always include `MMK` suffix after the number
- Use comma separators for thousands (1,000 not 1000)
- No decimal places for MMK (it's the smallest unit)
- In tables, right-align amounts
- In scam examples, keep the original format from the scam message

### Table Example

```jsx
<td className="text-right font-mono">500,000 MMK</td>
```

## Phone Numbers

### Myanmar Format

```
09XXXXXXXXX    (10 digits, starts with 09)
+959XXXXXXXXX  (international format)
```

### Display

```javascript
// Local display — show as-is from DB
// The DB stores as TEXT, no formatting needed for display
// Example: "09123456789"
```

### Validation

```javascript
const isValidMyanmarPhone = (phone) => /^09\d{8}$/.test(phone)
```

### Rules

- Store as plain string (no dashes/spaces)
- Display as stored — users recognize their own format
- In game scenarios, show the number as-is from the scam message
- Never mask phone numbers in scam examples (educational purpose)

## Names

### Myanmar Name Order

Myanmar names: **single word** (no first/last split typically)

```
Kyaw Zin        (two words — some have family name)
Aung Aung       (repeated syllable — common)
Ma Thida        ("Ma" is honorific, "Thida" is name)
```

### Display Rules

- Do NOT split into first/last name fields
- Store as a single `name` field
- In UI, display the full name as-is
- "Ma" / "U" / "Daw" are honorifics — keep them attached to the name

## Dates

### Myanmar Display Format

```javascript
// Preferred: DD/MM/YYYY (common in Myanmar)
const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

formatDate('2026-07-12')  // "12/07/2026"
```

### Rules

- Use DD/MM/YYYY format (not MM/DD/YYYY)
- Include time in 24-hour format when needed: `14:32`
- In payment slips (spot-the-fake game), show `DD/MM/YYYY HH:MM`

## Burmese Text

### Font

- Use system fonts that support Myanmar script
- Tailwind default fonts work — no special font needed
- For body text, ensure `font-family` includes Myanmar-capable fonts

### Text Direction

- Myanmar script is **left-to-right** (same as English)
- No RTL handling needed

### Line Height

- Myanmar script has ascenders/descenders — use `leading-7` or higher for readability
- Avoid tight line spacing for Burmese text

## i18n Integration

When adding Myanmar-formatted content to translated strings:

```json
// In locales/en.json
{
  "amount": "{{amount}} MMK"
}

// In locales/my.json
{
  "amount": "{{amount}} MMK"
}
```

MMK is used in both languages — keep it consistent.

## Common Patterns in This Project

### Scam Card Category Labels

Category names stay in English even in Burmese mode (they're technical terms):
- Fake APK
- Phishing Link
- Social Engineering

### Payment Slip (Spot-the-Fake Game)

```
Amount:     500,000 MMK
Date:       15/07/2026 14:32
From:       Ma Thida
To:         U Kyaw Zin
Txn ID:     84721
```

### Chat Simulator

- Scammer messages may mix English and Burmese
- Keep the original scam message format (don't reformat)
- Names like "KBZ Bank" stay in English
