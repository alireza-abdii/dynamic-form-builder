# Supported Field Types & Presets Reference

Every field in a form definition has a `key`, `type`, `label`, optional `required` (boolean), `hint` (string), and `placeholder` (string).

## 1. Field Types

| Type | Description | Specific Options | Example |
| :--- | :--- | :--- | :--- |
| `text` | Single line text | `minLength?: number`, `maxLength?: number`, `preset?: Preset` | `{"key":"fullName", "type":"text", "label":"نام و نام خانوادگی", "required":true}` |
| `textarea` | Multi-line text | `minLength?: number`, `maxLength?: number`, `rows?: number` | `{"key":"address", "type":"textarea", "label":"نشانی پستی", "required":false}` |
| `number` | Numeric input | `min?: number`, `max?: number`, `integer?: boolean` | `{"key":"childrenCount", "type":"number", "label":"تعداد فرزندان", "min":0, "max":20, "integer":true}` |
| `tel` | Phone / Mobile | `preset?: "iran-mobile" \| "phone"` | `{"key":"mobile", "type":"tel", "label":"شماره همراه", "required":true, "preset":"iran-mobile"}` |
| `select` | Dropdown selection | `options: Array<{ value: string, label: string }>` | `{"key":"dept", "type":"select", "label":"واحد", "options":[{"value":"it","label":"فناوری اطلاعات"}]}` |
| `multiselect`| Multi-item selector | `options: Array<{ value: string, label: string }>`, `minItems?: number`, `maxItems?: number` | `{"key":"skills", "type":"multiselect", "label":"مهارت‌ها", "options":[...], "minItems":1}` |
| `jalali-date`| Persian calendar date | `minDate?: "today" \| string`, `maxDate?: "today" \| string` | `{"key":"birthDate", "type":"jalali-date", "label":"تاریخ تولد", "required":true, "maxDate":"today"}` |

## 2. Presets

Presets automatically apply specialized regular expressions and Persian validation messages:
- `iran-mobile`: Matches standard Iranian mobile numbers (`^09\d{9}$`). Accepts Persian/Arabic digits, normalizes them, and strips leading `+98` or `0098`.
- `national-id`: Validates 10-digit Iranian National Code (کد ملی) including checksum verification algorithm.
- `postal-code`: Validates 10-digit Iranian Postal Code (`\b\d{10}\b`).
- `email`: Standard email format.
- `digits-only`: Only digits allowed.

## 3. Date Bounds
- `today`: Restricts selection to today or earlier/later depending on `minDate` / `maxDate`.
- `YYYY/MM/DD`: Exact Jalali date boundary (e.g. `1405/01/01`).

