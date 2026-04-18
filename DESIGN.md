# Songfore DJ Design System

## 1. Overview

This design system is **Airbnb-inspired, but adapted for `/dj`**, a mobile-first travel spot board where friends collect places, react to them, open details, check maps, and move ideas into a trip schedule.

The product should feel like:

- a friendly travel shortlist
- a photo-first discovery feed
- a lightweight planning tool
- a social board for a small private group

The overall tone is **warm, rounded, editorial, and approachable**. It should never feel like a productivity SaaS dashboard or a loud social media app. The UI must encourage browsing and comparing places at a relaxed pace.

### Core Product Feel

- **Photo-first**: every place starts with imagery
- **Soft trust**: maps, metadata, and structure should feel reliable
- **Mobile-native**: interactions should feel like a polished travel app, not a responsive desktop site shrunk down
- **Social but calm**: comments, likes, and recommendations exist, but the product is not feed-chaos

## 2. Visual Direction

Use **Airbnb-style softness** as the base:

- bright white and warm off-white surfaces
- generous rounding
- subtle layered card shadows
- strong image emphasis
- one primary accent color only

For `/dj`, the design should lean slightly more playful and group-trip oriented than Airbnb:

- recommendation metadata can feel a bit more casual
- category chips can be more colorful, but still muted
- schedule UI should feel tidy and card-based, not enterprise
- map and detail sheet should feel native to the rest of the feed

Avoid dark themes, brutalism, neon-heavy palettes, or overly corporate minimalism.

## 3. Color Palette

### Core

- **Background**: `#fbfbf8`
- **Surface**: `#ffffff`
- **Surface Soft**: `#f7f7f2`
- **Surface Muted**: `#f2f3ee`
- **Text Primary**: `#222222`
- **Text Secondary**: `#6f6f6a`
- **Text Tertiary**: `#9a9a94`
- **Border Soft**: `#ecebe4`

### Brand Accent

- **Primary Accent**: `#ff385c`
- **Primary Accent Hover**: `#e31c5f`
- **Accent Soft**: `#ffe6eb`

### Supporting Category Tones

These exist for chips, markers, and subtle labels only. They must stay soft and never overpower the main accent.

- **Cafe**: `#dff1eb`
- **Restaurant**: `#fde7dc`
- **Tour**: `#ddeafd`
- **Shopping**: `#ece7fb`
- **Etc**: `#edf1ea`

### Semantic

- **Success**: `#1f9d55`
- **Warning**: `#d97706`
- **Error**: `#dc2626`
- **Info**: `#2563eb`

## 4. Typography

The live project currently uses `Plus Jakarta Sans`, which is close enough to the intended soft, modern feel. Keep using it unless the team deliberately changes fonts across the whole app.

### Type Hierarchy

- **Display / Hero Title**: 32px, 800, line-height 1.02
- **Section Title**: 22px, 800, line-height 1.15
- **Card Title**: 18px, 800, line-height 1.2
- **Body**: 16px, 500, line-height 1.5
- **Secondary Body**: 14px, 500, line-height 1.45
- **Caption / Meta**: 13px, 500, line-height 1.35
- **Tiny Label**: 11px, 700, uppercase or tracked when needed

### Type Principles

- Headings should feel compact and confident, with slight negative tracking.
- Body copy should stay warm and easy to scan.
- Metadata should never overpower place names.
- Comments should read like chat, not like documentation.

## 5. Radius, Borders, and Shadows

### Radius Scale

- **Pill**: `9999px`
- **Small**: `12px`
- **Medium**: `16px`
- **Large**: `20px`
- **XL**: `24px`
- **Sheet / Major Card**: `28px` to `32px`

### Borders

- Use soft, low-contrast borders for structure.
- Borders should support surfaces, not dominate them.
- Avoid thick outlines except for focused interactive states.

### Shadows

Use soft layered shadows inspired by Airbnb:

- **Card Shadow**: subtle border ring + ambient blur + low lift
- **Hover Shadow**: slightly larger blur, never dramatic
- **Modal / Sheet Shadow**: soft and diffused, with a premium mobile feel

Do not use harsh drop shadows, black glows, or heavy skeuomorphic elevation.

## 6. Layout Principles

`/dj` is a **single-column mobile flow**.

### Feed

- A vertically stacked card feed is the primary browsing surface.
- Each card should prioritize image, title, recommendation, and social signal.
- Image and title must remain the strongest two elements.

### Detail Sheet

- The detail sheet is the center of deeper engagement.
- It should feel like a soft modal card rising from the bottom.
- The image, map, comment area, and action row should be clearly separated by spacing, not hard dividers.

### Map

- The map screen should feel like a companion view, not a different product.
- Overlays, summaries, and chips must visually match the feed.
- Real map render and fallback preview should share the same structural proportions.

### Schedule

- Schedule should feel more organized than the feed, but still part of the same product.
- Use day pills, timeline rhythm, and compact cards.
- Empty states must still preserve day structure.

## 7. Component Rules

### Header

- Keep the top area clean, branded, and lightweight.
- The title row may include a playful visual mark, but it should stay secondary to the service title.
- The header should never feel like a heavy app bar.

### Filter Chips

- Rounded pill chips with muted category tones.
- Active state should feel selected, but not shouty.
- The chip rail should blend into the page background with no artificial section banding.

### Place Cards

- Large image surface on top
- Overlay actions remain circular and high-contrast
- Title row below image
- Recommendation copy in a soft quote-style block or supportive text area

Cards should feel touchable, collectible, and trustworthy.

### Detail Actions

- `우리지도` is the product-native action
- `네이버 지도` is the external utility action
- Utility actions should feel slightly quieter than native actions

### Comments

- Comments should feel like lightweight group chat
- Author and time metadata stay subtle
- Comment count pill should be clearly visible but not oversized

### Bottom Navigation

- Rounded, floating, soft-surface navigation
- Active tab should feel clearly selected
- The plus action can feel more prominent, but should still belong to the same visual system

## 8. Motion and Interaction

- Use short, soft transitions: `160ms` to `240ms`
- Favor fade, lift, and subtle scale over flashy motion
- Avoid bounce animations or playful overshoot
- Opening sheets should feel calm and native
- Button feedback should feel tactile, not dramatic

## 9. Do's and Don'ts

### Do

- Do make imagery the hero of every place card
- Do keep surfaces rounded and soft
- Do use one strong accent color consistently
- Do keep mobile tap targets generous
- Do preserve a calm browsing rhythm with spacing
- Do make maps and schedule views feel part of the same family
- Do keep the product feeling premium, social, and travel-oriented

### Don't

- Don't make the UI feel like a work tool
- Don't use hard black shadows or harsh borders
- Don't overload screens with multiple competing accent colors
- Don't make metadata louder than place names
- Don't turn comments into a noisy social feed
- Don't use gradients as section separators
- Don't let utility views like map and schedule drift away from the main visual language

## 10. Responsive Guidance

- Optimize for mobile first
- Tablet can breathe more, but should still read like a mobile product stretched wider
- Desktop should remain centered and readable, not expand into a dashboard
- Horizontal rails should still feel natural on narrow screens

## 11. Product-Specific Guidance for Agents

When designing or restyling `/dj`, keep this priority order:

1. **Place image**
2. **Place title**
3. **Recommendation context**
4. **Map / schedule utility**
5. **Social metadata**

If forced to choose between decoration and clarity, choose clarity.

If forced to choose between novelty and trust, choose trust.

If forced to choose between generic social UI and warm travel UI, choose warm travel UI.

## 12. Implementation Notes for This Repo

- Apply this design system only to `/dj` unless explicitly requested otherwise.
- Preserve current UX flows unless the task explicitly includes interaction changes.
- Feed, detail sheet, map, schedule, add-place flow, and nickname prompt must remain visually consistent.
- External integrations like Naver Maps should be styled as part of the system, but their core behavior should remain reliable over decorative ambition.
