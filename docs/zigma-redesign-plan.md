# Zigma Redesign Plan

## Reference Sources

- `Zigma WPE ERP.html`
- `WP (1).zip`
  - `Design System.html`
  - `Operations Dashboard.html`
  - `Inventory Workspace.html`
  - `Masters CRUD.html`
  - `Production MES.html`
  - `GRN Receiving Workflow.html`
  - `assets/zigma.css`
  - `assets/zigma-app.css`
  - `assets/zigma-masters.css`
  - `assets/zigma-mes.css`
  - `assets/zigma-grn.css`
  - `assets/nav.js`

## 1. Design Language

- Dense enterprise UI for frequent operational use, not marketing presentation.
- Dark graphite global shell with light working surfaces.
- Single signal-orange accent for primary action, active route, and key emphasis.
- Display typography for headings and controls; body typography for forms and tables; mono typography for codes, IDs, and quantities.
- Cards, tables, and drawers use compact spacing and low-radius geometry.
- Status always combines label plus color, not color alone.
- Production and GRN full-screen flows shift into a control-room treatment with dark live-device panels.

## 2. Design Tokens

### Typography

- Display: `Archivo`
- Body: `IBM Plex Sans`
- Mono: `IBM Plex Mono`

### Core Color Tokens

- Accent: `#E8521A`
- Accent hover: `#CF4711`
- Accent strong: `#AE3C0E`
- Background: `#EEF1F5`
- Surface: `#FFFFFF`
- Surface alt: `#F6F8FA`
- Surface muted: `#EFF2F6`
- Text primary: `#14181E`
- Text secondary: `#3A434F`
- Text muted: `#687382`
- Divider: `#E2E7EE`
- Strong divider: `#C3CCD7`
- Graphite 950: `#0D1014`
- Graphite 900: `#12161B`

### Status Tokens

- Success: `#1B9A57`
- Warning: `#C98800`
- Error: `#D63B30`
- Info: `#2563EB`
- Pending: `#6B5BD2`

### Shape and Elevation

- Radius sm: `5px`
- Radius base: `7px`
- Radius lg: `10px`
- Radius xl: `14px`
- Base card shadow: subtle 1px/2px stack
- Popover / drawer shadow: deep multi-layer shadow

## 3. Navigation Architecture

### Top Level

- `Dashboard`
- `WPE Workspace`
- `Masters`

### Workspace Mega Menu

- Inventory
- Blending
- Production
- Store
- GRN
- Contacts
- Regrind

### Masters Mega Menu

- Admin Masters
- Common Masters
- Inventory & Store Masters
- Production Masters
- Recipe / BOM Masters
- Device & Label Masters

### WPE Source of Truth

- Navigation must be generated from current route definition modules, not duplicated static menus.
- Admin master visibility must continue to respect `adminMenu` permissions.

## 4. Component Pattern Mapping

### Shared Shell

- `AppLayout.tsx`
  - Current sidebar shell
  - Migrate to top nav + mega menu shell

### Page Header

- `PageHeader.tsx`
  - Migrate to compact Zigma pagehead pattern

### Primary Surface Components

- Buttons -> compact display-font buttons
- Inputs / selects / textareas -> low-radius, bordered, compact controls
- Tables -> uppercase display-font headers, tighter rows, lighter surfaces
- Badges -> uppercase status pills
- Cards -> 10px radius, light border, subtle shadow

### Module Patterns

- Dashboard -> KPI strip + operational surfaces
- Workspace list pages -> header, toolbar, tabs, table-card pattern
- Masters -> toolbar + table + row actions + drawer forms
- Production / GRN -> dedicated multi-rail MES shell

## 5. Page Layout Strategy

- Sticky graphite top bar across non-MES pages.
- Max content width around `1680px`.
- Breadcrumb row above page content.
- Page header inside page body, not inside the top bar.
- Full-screen MES flows handled separately from standard CRUD/list pages.
- Mobile falls back to a stacked grouped navigation sheet.

## 6. Module-by-Module Redesign Strategy

### Dashboard

- Apply KPI strip, route-driven quick access, recent activity and GRN/QCR surfaces.

### WPE Workspace

- Standardize header, tabs, toolbar, and list cards for:
  - Inventory
  - Blending
  - Store
  - GRN list pages
  - Regrind

### Production

- Split into:
  - Standard production list shell
  - MES manage-batch shell
  - Full-screen order create/edit shell

### Masters

- Standardize all CRUD pages on:
  - compact header
  - toolbar
  - table-card
  - right drawer forms

### User & Permission

- Apply the same masters CRUD system while preserving permission-driven visibility and actions.

## 7. Implementation Roadmap

### Phase 1

- Extract tokens into shared CSS variables.
- Replace sidebar with dynamic top-nav mega menu.
- Update shared primitives.
- Redesign dashboard using real WPE API data.

### Phase 2

- Convert workspace list pages:
  - Inventory
  - Blending
  - Store
  - GRN list/status
  - Regrind

### Phase 3

- Convert all masters list + form surfaces to the toolbar/table/drawer system.

### Phase 4

- Convert production and GRN full-screen workflows to the MES shell.

### Phase 5

- Tighten responsive behavior, chunking, and visual consistency across active routes.

## Phase 1 Delivered

- New shared design tokens in `src/index.css`
- Dynamic route-driven mega-menu shell in `src/components/AppLayout.tsx`
- Updated shared page header and stat card
- Updated shared button, badge, card, input, select, textarea, and table styling
- New dashboard surface aligned to the extracted design system
