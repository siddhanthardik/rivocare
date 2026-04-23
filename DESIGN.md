# RIVO — UX Design Specification

## Design Tokens

### Color Palette
```
Primary:    #2563EB  (Blue-600)   — CTAs, links, active states
Primary-D:  #1D4ED8  (Blue-700)   — Hover on primary
Primary-L:  #EFF6FF  (Blue-50)    — Light backgrounds
Accent:     #10B981  (Emerald-500) — Online, success, confirmed
Warning:    #F59E0B  (Amber-500)  — Pending, attention
Danger:     #EF4444  (Red-500)    — Cancelled, errors
Surface:    #FFFFFF              — Card backgrounds
BG:         #F8FAFC  (Slate-50)   — Page background
Border:     #E2E8F0  (Slate-200)  — Borders
Text-1:     #0F172A  (Slate-900)  — Primary text
Text-2:     #475569  (Slate-600)  — Secondary text
Text-3:     #94A3B8  (Slate-400)  — Placeholder text
```

### Typography
```
Font:        Inter (Google Fonts)
Heading-1:   36px / 700 / -0.02em
Heading-2:   28px / 700 / -0.01em
Heading-3:   20px / 600
Body-L:      16px / 400 / 1.6
Body-S:      14px / 400 / 1.5
Label:       12px / 500 / 0.04em uppercase
```

### Spacing Scale (4px base)
```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px
```

### Border Radius
```
sm: 6px | md: 10px | lg: 16px | full: 9999px
```

---

## User Roles & Flows

### Role: Patient
1. Land on homepage → click "Book a Service"
2. Register (name, email, phone, password, role=patient)
3. Login → redirected to /dashboard/patient
4. Dashboard: see upcoming bookings, quick-book button
5. Booking flow: select service → enter address+pincode → pick provider → confirm → success
6. View booking history, cancel pending bookings

### Role: Provider
1. Register with role=provider → select offered services + city/pincodes
2. Login → redirected to /dashboard/provider
3. Dashboard: toggle online/offline → see incoming booking requests
4. Accept / Decline bookings
5. Manage schedule, view earnings

### Role: Admin
1. Login (pre-seeded admin account)
2. Dashboard: KPI cards (users, bookings, revenue, active providers)
3. Manage users (view, suspend, change role)
4. Verify providers, view all bookings, manage services

---

## Screen Inventory

### Public Screens
| Screen | Route | Description |
|---|---|---|
| Landing | `/` | Hero, services grid, how-it-works, testimonials, CTA |
| Login | `/login` | Email/password, role-aware redirect |
| Register | `/register` | Name, email, phone, password, role picker |

### Patient Screens
| Screen | Route |
|---|---|
| Patient Overview | `/dashboard/patient` |
| Book Service | `/dashboard/patient/book` |
| My Bookings | `/dashboard/patient/bookings` |
| Profile | `/dashboard/patient/profile` |

### Provider Screens
| Screen | Route |
|---|---|
| Provider Overview | `/dashboard/provider` |
| Booking Requests | `/dashboard/provider/bookings` |
| Availability | `/dashboard/provider/availability` |
| Earnings | `/dashboard/provider/earnings` |
| Profile | `/dashboard/provider/profile` |

### Admin Screens
| Screen | Route |
|---|---|
| Admin Overview | `/dashboard/admin` |
| Users | `/dashboard/admin/users` |
| Providers | `/dashboard/admin/providers` |
| All Bookings | `/dashboard/admin/bookings` |
| Services | `/dashboard/admin/services` |

---

## Booking Flow (6 Steps)
```
Step 1: Select Service Category
        → Nurse / Physiotherapist / Doctor / Caretaker
        → Service cards with icon, description, base price

Step 2: Enter Location
        → Address textarea
        → Pincode (6 digits, validated)
        → "Find Providers" button

Step 3: Choose Provider
        → List of available providers filtered by pincode + service
        → Provider card: name, photo, rating, experience, price/hr
        → Select button

Step 4: Schedule
        → Date picker (min: today, max: 30 days)
        → Time slot picker (9am–6pm, 1hr slots)

Step 5: Confirm Details
        → Summary card: service, provider, date/time, address
        → Notes textarea (optional)
        → Total price
        → "Confirm Booking" button

Step 6: Success
        → Booking ID badge
        → Provider info
        → "Go to Dashboard" / "Book Another" buttons
```

---

## Component Inventory

### UI Primitives
- Button (primary, secondary, outline, ghost, danger) + sizes
- Input (text, email, password, phone, pincode)
- Textarea
- Select / Dropdown
- Badge (status-aware: pending=amber, confirmed=blue, completed=green, cancelled=red)
- Card (with header, body, footer slots)
- Modal (overlay + close)
- Avatar (initials fallback)
- Spinner / Skeleton loader
- Toast notifications

### Layout
- Header (public nav + auth nav with role-based links)
- Sidebar (dashboard nav, collapsible on mobile)
- PageWrapper (title + breadcrumb + children)
- MobileNav (bottom tab bar)
- StepProgress (booking wizard progress bar)

### Domain Components
- ServiceCard
- ProviderCard
- BookingCard (with status badge + actions)
- StatCard (dashboard KPI)
- BookingTimeline
- AvailabilityToggle (online/offline switch)
