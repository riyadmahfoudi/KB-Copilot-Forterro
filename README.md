# KB Copilot – Forterro v1.0

KB Copilot is a Chrome extension designed to standardize the formatting of Knowledge Base (KB) articles in the Forterro support portal.

The extension helps support engineers quickly generate and clean KB articles while enforcing the official KB structure and formatting guidelines.

---

# Features

## 1. KB Template Generator
Insert a standardized KB article template with predefined sections:

- Introduction
- Prerequisites
- Resources
- Article Title
- Subarea sections
- Change log table

This ensures all KB articles start with the correct structure.

---

## 2. Fix All Formatter

The **Fix All** button automatically corrects formatting issues inside the editor.

It enforces the official KB spacing and layout rules.

### Formatting rules

| Rule | Behavior |
|-----|------|
| Intro → Prerequisites | 1 line |
| Prerequisites → Content | 0 lines |
| Resources → Content | 0 lines |
| Prerequisites → Resources | 1 line |
| Last section → Article Title | 4 lines |
| Title → Divider | automatic |
| Divider → Content | 2 lines |
| Subarea → Content | 1 line |
| Text → Image | 1 line |
| Image → Text | 4 lines |
| Image → Image | 1 line |
| Table spacing | 10 lines above |

---

## Typography Rules

The extension enforces the official KB font sizes:

| Element | Font |
|------|------|
| Article Title | Arial 24 |
| Subarea Title | Arial 18 |
| Normal text | Arial 14 |

---

## Smart Behavior

The formatter also handles dynamic content situations:

- Sections can be removed (Resources, Subarea)
- Images may or may not exist
- Spacing recalculates automatically
- No duplicate blank lines
- No unwanted indentation
- Stable formatting when Fix All is run multiple times
