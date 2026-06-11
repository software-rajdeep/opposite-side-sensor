# Theme Application Prompt — Rajdeep Automation Visual Identity

Apply the **exact visual identity** from the Rajdeep Automation Thickness Monitoring System to the target project. **Do NOT change any functionality, layout structure, or component behavior.** Only update colors, fonts, spacing, shadows, borders, animations, and styling variables — maintaining the original layout exactly.

---

## 1. Brand Color Palette

Replace all color tokens with these exact values:

```css
/* Primary Brand Colors */
--brand-deep:   #182456;
--brand-mid:    #233A82;
--brand-light:  #30549C;
--brand-accent: #3B55A8;
--brand-blue:   #5C7BD6;

/* Background Layers (clean, professional) */
--bg:          #ffffff;
--bg2:         #f8f9fb;
--bg3:         #f0f2f6;
--bg4:         #e6e8ee;

/* Borders */
--border:      #dfe2e9;
--border2:     #c8ccd6;

/* Accent Colors */
--blue:        #3B55A8;
--blue-dim:    #233A82;
--blue-ghost:  rgba(59,85,168,0.06);

/* Status Indicators (muted, professional) */
--green:       #4a7a5e;
--green-dim:   #385c48;
--green-ghost: rgba(74,122,94,0.06);
--amber:       #7a7850;
--amber-ghost: rgba(122,120,80,0.06);
--red:         #8a6262;
--red-ghost:   rgba(138,98,98,0.06);

/* Text */
--slate:       #6b7280;
--text:        #1a1f2e;
--text-2:      #5b657a;
--text-3:      #8e97ab;
```

---

## 2. Typography

- **Primary Font**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  - Load from Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap`
- **Monospace Font**: `'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', Consolas, monospace`
- **Base Font Size**: 14px
- **Font Smoothing**: `-webkit-font-smoothing: antialiased`
- **CSS Variables**:
  ```css
  --sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono: 'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', Consolas, monospace;
  ```

---

## 3. Border Radius & Shadows

```css
--r:   6px;   /* default rounded corners */
--r2:  10px;  /* larger rounded corners */
--shadow:  0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03);
--shadow2: 0 4px 16px rgba(0,0,0,0.05);
```

---

## 4. Animations

Include these keyframe animations:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-up { animation: fadeUp 0.35s ease both; }
.fade-in { animation: fadeIn 0.25s ease both; }
```

---

## 5. Scrollbar Styling

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
```

---

## 6. Specific Component Styling Rules

### Topbar / Navigation Bar
- Height: 60px, white background, bottom border 1px solid `var(--border)`
- Sticky positioning at top, z-index: 200
- Brand name: bold 14px, color `var(--brand-deep)` with span in `var(--brand-accent)`
- Brand divider: 1px x 26px, background `var(--border)`
- Breadcrumb: 13px, color `var(--text-2)`, active item `var(--text)` weight 600
- Role badges: 10px uppercase, semibold, with colored border/background per role
- User button: background `var(--bg3)`, border `var(--border)`, hover background `var(--bg4)`
- Avatar: 28x28px, gradient `var(--brand-mid)` → `var(--brand-accent)`, white text

### Sidebar
- Width: 230px, white background, right border `var(--border)`
- Padding: 16px 10px, gap between items: 2px
- Sticky top: 60px, height: calc(100vh - 60px)
- Section labels: 10px uppercase, 0.8px letter-spacing, color `var(--text-3)`
- Nav items: 13px, weight 500, padding 9px 10px, border-radius `var(--r)`
  - Hover: background `var(--bg3)`
  - Active: background `var(--blue-ghost)`, color `var(--blue)`, border `rgba(59,85,168,0.12)`, weight 600
  - SVG icons: opacity 0.6, active opacity 1
  - Danger items: red ghost on hover

### Cards
- White background, border 1px `var(--border)`, border-radius `var(--r2)`
- Box-shadow `var(--shadow)`
- Card header: background `var(--bg2)`, bottom border `var(--border)`, padding 14px 18px
- Card title: 13px, weight 600, SVG icon color `var(--text-2)`
- Card body: padding 18px

### Buttons
- Base `.btn`: inline-flex, gap 7px, padding 8px 16px, border-radius `var(--r)`, 13px, weight 500
  - Active scale: 0.98
- `.btn-blue`: gradient `var(--brand-mid)` → `var(--brand-accent)`, white text
  - Hover: gradient `var(--brand-deep)` → `var(--brand-mid)`, shadow `0 4px 12px rgba(35,58,130,0.15)`
- `.btn-outline`: white bg, `var(--text-2)` text, border `var(--border)`
  - Hover: border `var(--brand-accent)`, color `var(--blue)`
- `.btn-green`: bg `var(--green-dim)`, white text
- `.btn-red`: bg `var(--red-ghost)`, color `var(--red)`
- `.btn-sm`: padding 5px 12px, font-size 12px

### Badges
- inline-flex, padding 2px 8px, border-radius 4px, 11px semibold, border 1px
- Color variants: green, red, blue, amber (each with matching ghost background)

### Tables
- White background, border `var(--border)`, border-radius `var(--r2)`
- Header: background `var(--bg3)`, 11px uppercase, weight 600, 0.6px letter-spacing, color `var(--text-3)`
- Rows: border-bottom `var(--border)`, hover background `var(--bg3)`
- Cells: padding 11px 16px, 13px

### Form Controls
- `.form-input`, `.form-select`: white bg, border 1.5px `var(--border)`, border-radius `var(--r)`, 13px, padding 8px 11px
  - Focus: border `var(--brand-accent)`, box-shadow `0 0 0 3px rgba(59,85,168,0.08)`

### Modal / Dialog
- Overlay: `rgba(15, 23, 42, 0.5)` with `backdrop-filter: blur(4px)`
- Card: max-width 520px, white bg, border `var(--border2)`, border-radius 16px, padding 28px, shadow `0 24px 80px rgba(0,0,0,0.1)`
- Title: 18px, weight 700, color `var(--brand-deep)`

### Login Page
- Centered layout with min-height 100vh
- Background: radial gradient at 50% 30% `rgba(59,85,168,0.05)` → transparent, + linear gradient `#f0f2f8` → `#ffffff`
- Card: max-width 400px, white bg, border-radius 14px, padding 40px 36px, shadow `0 8px 32px rgba(0,0,0,0.05)`
- Logo height: 42px
- Input wrap: border 1.5px `var(--border)`, focus: border `var(--brand-accent)` + ring

### Stat Cards
- Grid with `auto-fit, minmax(180px, 1fr)`, gap 14px
- White bg, border `var(--border)`, border-radius `var(--r2)`, padding 18px 20px
- Hover: border `var(--border2)`, shadow `var(--shadow2)`
- Label: 11px uppercase, weight 600, letter-spacing 0.6px, color `var(--text-2)`
- Value: 26px, weight 700, color `var(--text)`

### Sensor Status Pills
- flex wrap, gap 10px
- Pill: white bg, border `var(--border)`, border-radius 20px, padding 5px 14px, 12px
- `.online`: border `rgba(74,122,94,0.2)`, bg `rgba(74,122,94,0.03)`
- `.offline`: border `rgba(138,98,98,0.12)`, bg `rgba(138,98,98,0.03)`
- Status dot: 7px, border-radius 50%, online = `var(--green)` with glow, offline = `var(--red)`

### Toasts
- Fixed bottom-right, white bg, border `var(--border)`, border-radius `var(--r)`, padding 12px 16px
- Shadow `0 8px 32px rgba(0,0,0,0.07)`, fadeUp animation, z-index 9999

---

## 7. Page Layout Spacing

- Page header: padding `28px 32px 0`, margin-bottom 24px
- Page title: 22px, weight 700, color `var(--brand-deep)`, letter-spacing `-0.4px`
- Page subtitle: 12px, color `var(--text-2)`
- Content sections (stats-grid, nav-grid, config-grid, sensor-status-row): padding `0 32px`
- `.section`: padding `0 32px`, margin-bottom 20px
- Responsive at 768px: sidebar hidden, all paddings reduced to 16px

---

## 8. Instructions

1. Replace your project's CSS custom properties with the palette and values above
2. Import Inter font from Google Fonts in your HTML `<head>`
3. Apply the base body styling: font-family Inter, 14px, white background, antialiased
4. Update all component classes to use the CSS variables above (colors, borders, radii, shadows)
5. Add the animation keyframes
6. Update scrollbar styling
7. Apply gradient button styles where buttons exist
8. Update any status indicators (online/offline, badges) to use the muted color scheme
9. Wrap login pages with the radial gradient background
10. Apply the card/table/form control patterns consistently

**Do NOT modify:**
- Component layout structure (HTML/JSX structure stays the same)
- Functionality or business logic
- Responsive breakpoints beyond the visual styles above
- Any JavaScript/TypeScript behavior