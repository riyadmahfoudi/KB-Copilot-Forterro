# KB Tool – Forterro v1.1

KB Tool is a Chrome extension designed to standardize the formatting of Knowledge Base (KB) articles in the Forterro support portal.

The extension helps support engineers quickly generate, validate, and clean KB articles while enforcing the official KB structure and formatting guidelines.

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

This ensures all KB articles start with the correct structure and layout.

---

## 2. Fix All Formatter

The **Fix All** button automatically corrects formatting issues inside the editor.

It enforces the official KB spacing, layout, and typography rules to ensure every article follows the KB standards.

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

## 3. Screenshot Image Enhancer

KB Tool automatically improves screenshots inserted in KB articles.

When images are detected in the editor, the extension can apply standardized visual formatting to make them clearer and more consistent.

### Image formatting rules

| Rule | Behavior |
|------|------|
| Image border | Adds a clean border around screenshots |
| Image spacing | Automatically adjusts spacing around images |
| Image separation | Prevents images from sticking together |
| Text spacing | Maintains correct spacing between text and images |

This ensures screenshots inside articles remain clean, readable, and visually consistent.

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

The formatter is designed to handle dynamic content situations automatically.

- Sections can be removed (Resources, Subarea)
- Images may or may not exist
- Spacing recalculates automatically
- No duplicate blank lines
- No unwanted indentation
- Stable formatting when **Fix All** is run multiple times

---

## Goal

KB Tool reduces manual formatting work for support engineers and ensures every Knowledge Base article follows the Forterro KB publishing standards.
