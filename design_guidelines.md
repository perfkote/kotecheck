# ShopFlow Design Guidelines

## Design Approach
**System-Based Approach** - Drawing from Linear's clean productivity aesthetic combined with Material Design principles for data-heavy interfaces. This application prioritizes efficiency, scannability, and task completion over visual flourish.

## Typography System

**Font Family**: Inter (via Google Fonts CDN)
- Primary: Inter for all UI elements
- Monospace: 'JetBrains Mono' for job IDs, reference numbers

**Hierarchy**:
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-medium
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels: text-sm font-medium uppercase tracking-wide
- Helper Text: text-sm
- Table Headers: text-xs font-medium uppercase tracking-wider

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Micro spacing: p-2, gap-2 (buttons, tight groups)
- Standard spacing: p-4, gap-4, mb-4 (cards, form fields)
- Section spacing: p-6, mb-6 (card padding, section breaks)
- Major spacing: p-8, gap-8, mb-8 (page padding, major sections)

**Grid System**:
- Sidebar: w-64 fixed sidebar navigation
- Main content: Remaining width with max-w-7xl container, px-8 py-6
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- Tables: Full-width within content area

## Core Components

### Navigation
**Sidebar Navigation** (fixed left):
- Company logo/name at top (h-16 with p-4)
- Navigation links in vertical stack with gap-2
- Each link: p-3 rounded-lg with icon (24px) + label
- Active state: Distinct background treatment
- Bottom section: User profile with avatar + name

### Dashboard Layout
**Header Bar**:
- Breadcrumb navigation (text-sm)
- Page title (text-3xl)
- Primary action button (right-aligned)

**Stats Cards** (Dashboard overview):
- Grid of 3-4 metric cards
- Each card: p-6 rounded-lg border
- Large number (text-4xl font-bold)
- Label below (text-sm)
- Small trend indicator with icon

**Recent Activity List**:
- Two-column layout below stats
- Left: Recent Jobs (larger column, 2/3 width)
- Right: Quick Actions + Upcoming (1/3 width)

### Data Tables
**Job/Customer Tables**:
- Full-width with subtle borders
- Header: border-b-2 with py-3 px-4
- Rows: border-b py-4 px-4
- Hover state on rows
- Status badges: Inline with px-3 py-1 rounded-full text-xs font-medium
- Action buttons: Right-aligned icon buttons (24px)
- Pagination: Bottom-right with page numbers

### Forms
**Input Fields**:
- Labels: mb-2 block
- Inputs: w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-2
- Helper text: mt-1 text-sm
- Error state: border-red-500 with error message below

**Form Layout**:
- Single column for narrow forms (max-w-2xl)
- Two-column grid (grid-cols-2 gap-6) for wider forms
- Full-width textarea for notes
- Button group at bottom: flex justify-end gap-4

**Select Dropdowns**:
- Match input styling
- Custom dropdown arrow icon

### Cards
**Customer/Job Cards**:
- p-6 rounded-lg border
- Header with title + icon/status badge
- Key info in two-column grid (grid-cols-2 gap-4)
- Footer actions: flex justify-between items-center mt-6 pt-4 border-t

### Modals/Dialogs
**Structure**:
- Overlay: Full-screen backdrop
- Modal: max-w-2xl centered, rounded-lg
- Header: p-6 border-b with title + close button
- Body: p-6 max-h-[60vh] overflow-y-auto
- Footer: p-6 border-t with action buttons

### Buttons
**Primary Action**: px-6 py-3 rounded-lg font-medium
**Secondary Action**: px-6 py-3 rounded-lg border font-medium
**Icon Buttons**: p-2 rounded-lg (for table actions, close buttons)
**Danger Actions**: Distinct treatment for delete/cancel

### Status Indicators
**Job Status Badges**:
- Pending, In Progress, Completed, Cancelled
- px-3 py-1 rounded-full text-xs font-semibold
- Inline in tables and cards

**Priority Indicators**:
- Small dot (w-2 h-2 rounded-full) before text labels
- Low, Medium, High, Urgent

## Component-Specific Guidelines

### Customer List View
- Search bar at top (w-full max-w-md)
- Filter buttons row below search
- Table with: Name, Contact, Recent Jobs, Total Value, Status, Actions
- Add Customer button (top-right)

### Job Detail View
- Two-column layout: Main info (2/3) + Sidebar (1/3)
- Main: Job details form, notes section, estimate preview
- Sidebar: Customer info card, status timeline, attachments list

### Estimate Builder
- Line items table with add/remove rows
- Each row: Description, Quantity, Unit Price, Total (auto-calculated)
- Subtotal, Tax, Total in right-aligned summary section
- Preview/Print button generates formatted estimate view

### Notes Section
- Chronological list of notes
- Each note: Avatar + Name + Timestamp + Content
- Add note: Textarea with Submit button at bottom
- Notes attached to jobs or customers

## Icons
**Icon Library**: Heroicons (outline for navigation, solid for actions)
- Use 20px icons for buttons
- Use 24px icons for navigation
- Use 16px icons for inline status indicators

## Accessibility
- All form inputs have associated labels
- Keyboard navigation for all interactive elements
- Focus states use ring-2 ring-offset-2
- Sufficient contrast for all text elements
- Screen reader text for icon-only buttons

## Animations
**Minimal, Purposeful Motion**:
- Transition property for hover states: transition-colors duration-200
- Fade in for modals/dropdowns: fade + scale animation
- No scroll animations or decorative motion
- Loading states: Simple spinner, no skeleton screens

This system prioritizes data density, quick scanning, and efficient task completion—essential for shop management workflows.