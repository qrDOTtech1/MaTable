# Design System — A table !

Documentation complète du système de design unifié pour toutes les interfaces A table !

---

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Component Library](#component-library)
4. [Usage Examples](#usage-examples)
5. [Theme Support](#theme-support)
6. [Best Practices](#best-practices)

---

## Overview

Le design system est basé sur une **palette sombre par défaut** avec un accent **orange vif (#f97316)** inspirée du mockup 2A (Kanban OS-style). Tous les composants supportent le **light/dark mode** via CSS variables et Tailwind.

### Architecture

```
apps/web/
├── lib/
│   └── design-system.ts          # Tokens centralisés
├── components/
│   ├── ui/                        # Composants réutilisables
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Select.tsx
│   │   ├── StatCard.tsx
│   │   ├── OrderCard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── Table.tsx
│   │   └── index.ts              # Exports centralisés
│   └── layout/
│       └── DashboardLayout.tsx    # Wrapper principal
└── app/
    └── dashboard/
        ├── live/page.tsx          # Kanban kitchen view
        ├── stats/page.tsx         # Analytics
        ├── commandes/page.tsx     # Order history
        └── serveurs/page.tsx      # Staff management
```

---

## Design Tokens

### Colors

```typescript
// Primary
primary: "#f97316" (Orange)
primaryLight: "#fb923c"
primaryDark: "#ea580c"

// Backgrounds
bg.primary: "#0a0a0a" (Main)
bg.secondary: "#111" (Cards)
bg.tertiary: "#141414" (Hover)

// Text
text.primary: "#ffffff"
text.secondary: "#ffffff80" (50%)
text.tertiary: "#ffffff40" (25%)
text.quaternary: "#ffffff20" (12%)

// Borders
border.default: "#ffffff0f" (6%)
border.light: "#ffffff1a" (10%)
border.lighter: "#ffffff33" (20%)

// Status Colors
pending: Yellow (#eab308)
cooking: Orange (#f97316)
served: Emerald (#10b981)
error: Red (#ef4444)
```

### Spacing

```typescript
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
4xl: 64px
```

### Typography

```typescript
h1: 48px, weight 900, line-height 1.05
h2: 32px, weight 800, line-height 1.2
h3: 24px, weight 700, line-height 1.3
body: 16px, weight 400, line-height 1.6
small: 14px, weight 400, line-height 1.5
xs: 12px, weight 400, line-height 1.4
```

### Access Tokens

```typescript
import { DESIGN_TOKENS, BREAKPOINTS, getStatusColor, getStatusEmoji } from "@/lib/design-system";

// Use colors
const color = DESIGN_TOKENS.colors.primary; // "#f97316"
const statusColor = getStatusColor("pending"); // { bg, border, text }
const emoji = getStatusEmoji("cooking"); // "👨‍🍳"

// Use spacing
const spacing = DESIGN_TOKENS.spacing.lg; // "16px"

// Use responsive breakpoints
const breakpoint = BREAKPOINTS.lg; // "1024px"
```

---

## Component Library

### Core Components

#### Card
Base container with optional variants and hover effects.

```tsx
import { Card } from "@/components/ui";

<Card variant="default" hover>
  Content here
</Card>

// Variants: default | pending | cooking | served | stat
```

#### Button
Button with multiple variants and sizes.

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>

// Variants: primary | secondary | danger
// Sizes: sm | md | lg
```

#### Badge
Status/count indicator.

```tsx
import { Badge } from "@/components/ui";

<Badge variant="cooking">👨‍🍳 En préparation</Badge>

// Variants: default | pending | cooking | served | stat
```

#### Input
Form input field with validation.

```tsx
import { Input } from "@/components/ui";

<Input
  label="Email"
  placeholder="user@example.com"
  type="email"
  error={error}
  icon="✉️"
  fullWidth
/>

// Props: label, error, helpText, icon, fullWidth, variant, disabled
```

#### Modal
Dialog component.

```tsx
import { Modal } from "@/components/ui";

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={{
    primary: { label: "Save", onClick: handleSave },
    secondary: { label: "Cancel", onClick: handleClose }
  }}
>
  Content here
</Modal>
```

#### Select
Dropdown selector.

```tsx
import { Select } from "@/components/ui";

<Select
  label="Status"
  options={[
    { value: "pending", label: "Pending" },
    { value: "cooking", label: "Cooking" }
  ]}
  value={status}
  onChange={setStatus}
/>
```

### Data Display

#### StatCard
KPI metrics with trends.

```tsx
import { StatCard } from "@/components/ui";

<StatCard
  icon="📊"
  label="Revenue"
  value="$2,500"
  trend={{ direction: "up", percentage: 12 }}
  subtitle="Last 7 days"
/>
```

#### OrderCard
Individual order display.

```tsx
import { OrderCard } from "@/components/ui";

<OrderCard
  id="1"
  tableNumber={5}
  status="cooking"
  items={[
    { name: "Burger", quantity: 2 }
  ]}
  totalAmount={3400}
  createdAt={new Date()}
  eta={8}
  dragHandle="≡"
/>
```

#### Table
Data table with custom columns.

```tsx
import { Table } from "@/components/ui";

<Table
  columns={[
    { header: "Name", key: "name", width: "50%" },
    { 
      header: "Price", 
      key: "price", 
      width: "50%",
      render: (value) => `$${(value / 100).toFixed(2)}`
    }
  ]}
  data={items}
/>
```

#### KanbanColumn
Reusable Kanban column.

```tsx
import { KanbanColumn } from "@/components/ui";

<KanbanColumn
  title="In Progress"
  icon="👨‍🍳"
  count={5}
  color="orange"
>
  {items.map(item => <OrderCard key={item.id} {...item} />)}
</KanbanColumn>

// Color: yellow | orange | emerald
```

### Layout

#### DashboardLayout
Main layout wrapper with tabs and theme toggle.

```tsx
import { DashboardLayout } from "@/components/ui";

<DashboardLayout
  activeTabId="live"
  tabs={[
    { id: "live", icon: "🔴", label: "Live", badge: 5 },
    { id: "stats", icon: "📊", label: "Stats" }
  ]}
  onTabChange={(tabId) => navigate(`/dashboard/${tabId}`)}
  restaurantName="My Restaurant"
  title="Kitchen"
>
  {children}
</DashboardLayout>
```

---

## Usage Examples

### Creating a Dashboard Page

```tsx
"use client";

import { useState } from "react";
import { DashboardLayout, StatCard, Table } from "@/components/ui";

export default function AnalyticsDashboard() {
  const tabs = [
    { id: "live", icon: "🔴", label: "Live", badge: 0 },
    { id: "stats", icon: "📊", label: "Stats", badge: 0 },
  ];

  return (
    <DashboardLayout
      activeTabId="stats"
      tabs={tabs}
      onTabChange={(id) => console.log(id)}
      restaurantName="Restaurant"
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="📊"
            label="Orders"
            value={245}
            trend={{ direction: "up", percentage: 12 }}
          />
        </div>

        {/* Data Table */}
        <Table columns={[...]} data={[...]} />
      </div>
    </DashboardLayout>
  );
}
```

### Creating a Kanban Board

```tsx
import { KanbanColumn, OrderCard } from "@/components/ui";

function KitchenLive() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <KanbanColumn title="Pending" icon="⏳" count={pending.length} color="yellow">
        {pending.map(order => (
          <OrderCard key={order.id} {...order} />
        ))}
      </KanbanColumn>

      <KanbanColumn title="Cooking" icon="👨‍🍳" count={cooking.length} color="orange">
        {cooking.map(order => (
          <OrderCard key={order.id} {...order} />
        ))}
      </KanbanColumn>

      <KanbanColumn title="Served" icon="✅" count={served.length} color="emerald">
        {served.map(order => (
          <OrderCard key={order.id} {...order} />
        ))}
      </KanbanColumn>
    </div>
  );
}
```

---

## Theme Support

### Dark Mode (Default)

All components use dark mode by default via Tailwind and design tokens.

### Light Mode

To support light mode in DashboardLayout:

```tsx
const [theme, setTheme] = useState<"dark" | "light">("dark");

const isDark = theme === "dark";
const bgPrimary = isDark ? "bg-[#0a0a0a]" : "bg-white";
const textPrimary = isDark ? "text-white" : "text-slate-900";

// Use in className
<div className={`${bgPrimary} ${textPrimary}`}>
  Content
</div>
```

### CSS Variables

The design system exports CSS variables for custom use:

```typescript
import { getCSSVariables } from "@/lib/design-system";

// In your stylesheet
const css = getCSSVariables();
```

---

## Best Practices

### 1. Use the Component Library
Always use exported components instead of recreating styles.

```tsx
// ✅ Good
<Button variant="primary" size="md">Click</Button>

// ❌ Avoid
<button className="px-4 py-2 bg-orange-500 rounded-lg">Click</button>
```

### 2. Use Design Tokens
Reference colors and spacing from the centralized design system.

```tsx
// ✅ Good
const color = DESIGN_TOKENS.colors.primary;

// ❌ Avoid
const color = "#f97316"; // Hardcoded
```

### 3. Consistent Spacing
Use the spacing scale for all padding/margins.

```tsx
// ✅ Good
<div className="p-6 space-y-4">
  {/* p-6 = 24px, space-y-4 = 16px gap */}
</div>

// ❌ Avoid
<div className="p-5 gap-3">
  {/* Non-standard values */}
</div>
```

### 4. Component Composition
Build complex UIs by composing base components.

```tsx
// ✅ Good
<DashboardLayout>
  <div className="grid grid-cols-3 gap-4">
    <StatCard {...props} />
    <StatCard {...props} />
    <StatCard {...props} />
  </div>
</DashboardLayout>

// ❌ Avoid
<div>
  {/* One-off layout without structure */}
</div>
```

### 5. Responsive Design
Use Tailwind's responsive modifiers consistently.

```tsx
// ✅ Good
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// ❌ Avoid
<div className="grid gap-4">
  {/* No responsive behavior */}
</div>
```

### 6. Accessibility
- Always provide `label` props for form fields
- Use semantic HTML (`<button>`, `<table>`, etc.)
- Include alt text for icons when needed
- Ensure color contrast meets WCAG standards

```tsx
// ✅ Good
<Input label="Email" type="email" fullWidth />
<Button>Click me</Button>

// ❌ Avoid
<input /> {/* No label */}
<div onClick={...}>Click me</div> {/* Not a button */}
```

---

## File Structure Checklist

When creating new dashboard pages:

- [ ] Add "use client" directive
- [ ] Import components from "@/components/ui"
- [ ] Use DashboardLayout as wrapper
- [ ] Define tabs array with id, icon, label, badge
- [ ] Use grid/space utilities for layout
- [ ] Test light/dark mode toggle
- [ ] Verify responsive behavior (mobile, tablet, desktop)
- [ ] Add page to git

---

## Support

For questions or issues with the design system:
1. Check existing components in `apps/web/components/ui/`
2. Review usage examples in dashboard pages
3. Refer to design tokens in `apps/web/lib/design-system.ts`
4. Check DESIGN_TOKENS export for available values

---

**Last updated**: 2026-04-21
**Version**: 1.0
**Status**: Active & Maintained
