# Smiling Wallet — Frontend PRD

## Overview
Two-sided dental care marketplace. Clients submit treatment requests; nearby verified clinics respond with anonymous price offers. Client compares offers, accepts best fit, pays 1% matchmaking fee, clinic identity is revealed.
Tagline: "One Request, Multiple Offers, One Perfect Smile."

## Tech Stack
- React 18 + TypeScript, Vite
- Tailwind CSS + CSS Modules
- SockJS + @stomp/stompjs (WebSocket)
- Cloudinary signed URLs (X-ray / CT scan uploads)
- React Router v6
- React Context + hooks for state
- Backend: Spring Boot 4, Java 21 on localhost:8080
- Auth: JWT (memory / httpOnly cookie — no localStorage)
- Colors: Purple #7F77DD primary, Mint/Teal #1D9E75 accent, Light lavender bg

## User Roles
- CLIENT: submits dental requests, reviews anonymous offers, accepts match, pays fee, accesses appointment page
- CLINIC: reviews incoming requests, sends/edits/declines offers, tracks statuses on dashboard

---

## CLIENT PAGES

### Page 1 — Home (Route: /)
- Nav: Logo, Home, Appointments, Send Request, My Offers, About, avatar/auth button
- Hero: "One Request, Multiple Offers, One Perfect Smile!" + "Send Request" CTA
- 6 service cards (icon + title + description): General Dentistry, Dental Implant, Orthodontics, Cosmetic Dentistry, Pediatric Dentistry, Emergency Care

### Page 2 — Send Request (Route: /send-request)
Three stacked sections:
1. Personal Information: First Name, Last Name, Location, Date, Phone, Email
2. Clinical Details: Treatment Category (dropdown), Treatment Requirement, Dental CT Scan (Cloudinary upload), Symptom Summary
3. Insurance & Payment: Payment Method Preference, Budget Range, Insurance Provider
- Payment radio: Insurance | Self-Pay / Out-of-Pocket | Financing/Payment Plan
- Submit → POST /api/requests → success toast

### Page 3 — My Offers (Route: /my-offers)
- Left panel: Anonymous doctor cards (Dr. #1, Dr. #2…) with avatar, star rating, price range, "Best Value" badge. Paginated. "Show Statistics" toggle.
- Right panel: Selected offer detail — price range, exact quote, date/time, "Request Alternative Time", Special Mentions list, Match Score %, Savings Analysis, Offer Valid Until, "Accept Offer" CTA
- Analytics section (below):
    - Procedure summary dropdown
    - Pie chart: price range distribution
    - Stat cards: Average Price, Best Value Offer
    - Bar chart: offers per star rating
- Doctor identity hidden until 1% fee paid

### Page 4 — Appointments (Route: /appointments)
- Shown after accepting offer + paying 1% fee
- Hero: "Congratulations! Your Perfect Smile is on its way." — reveals matched clinic name
- Confirmed Appointments table: Date, Time, Treatment, Status (Match Confirmed)
- Your Dental Team card: revealed doctor avatar, name, rating, reviews
- Clinic Contact: Phone, Email, Address
- Directions: map thumbnail
- Buttons: "Message Dr." (mailto/chat), "Call Clinic"
- Footer summary: Reveal Triggered, 1% Fee Applied, Procedure list, Total Accepted Price

### Page 5 — About (Route: /about)
- About us section + doctor illustration
- How it works (3 steps):
    1. Request ($1) — Submit anonymously
    2. Compare — Anonymous quotes + metrics
    3. Match (1%) — Pay to unlock identity
- "The choice is yours!" + Send Request CTA

---

## CLINIC PAGES

### Page 6 — Review Requests (Route: /clinic/review-requests)
- Nav: Logo, Review Request (active), Clinic DashBoard, avatar
- Table: Patient ID, Treatment Category, Symptoms Summary, Time Slot, CT Scan link, Action
- Action: eye icon (view patient modal) + "+ Send Offer" button
- Pagination

Add New Offer modal:
- Title: "Add New Offer – Patient: #P[id]"
- Fields: Price Quote (€), Date, Time
- Buttons: Cancel, Send Offer

View Patient modal:
- Shows: Treatment Category, Treatment Requirement, CT Scan link, Symptoms Summary
- Pre-filled: Price Quote, Date, Time
- Buttons: Cancel, Edit

### Page 7 — Clinic Dashboard (Route: /clinic/dashboard)
- Stat cards: Total Offers Sent (green), Accepted Offers (purple)
- Table: Offer ID, Patient Name, Price Quote (€), Date/Time, Offer Status, Edit
- Status badges: Accepted (green), Sent (teal), Declined (gray)
- Edit icons: eye (view), pencil (edit if not yet accepted), trash (delete)
- Pagination

Delete confirmation modal:
- "Are you sure you want to delete [Name]?"
- Buttons: Cancel, Delete (coral)

---

## SHARED COMPONENTS
- Navbar (client variant + clinic variant)
- Modal (reusable overlay — close ×, title, body, footer buttons)
- StatusBadge (Accepted/Sent/Declined pill)
- Pagination (prev/next arrows + page numbers)
- Toast notifications (success/error)
- FileUpload (CT scan/X-ray → Cloudinary signed URL)
- StarRating (read-only, 5-star fractional)
- PieChart + BarChart (Recharts or Chart.js)

---

## DESIGN TOKENS
- Primary: #7F77DD (purple) — buttons, active nav, badges
- Accent: #1D9E75 (mint/teal) — Accepted status, Send Offer buttons
- Background: #F0EEFF light lavender page, white cards
- Text: #1A1A2E headings, #6B6B8A body
- Danger: #E8593C coral — Delete, errors
- Border radius: 12px cards, 8px inputs, 20px pills
- Font: system sans-serif, headings 500 weight

---

## API INTEGRATION
- Base URL: http://localhost:8080/api
- Auth: JWT Bearer token in Authorization header
- WebSocket: ws://localhost:8080/ws (SockJS + STOMP)
- Subscribe /topic/offers/{requestId} — real-time new offers (client)
- Subscribe /topic/requests — incoming requests (clinic)
- File upload: POST /api/files/upload → Cloudinary signed URL
- All lists paginated: ?page=0&size=10

---

## FRONTEND-ONLY PHASE
Mock all API calls with static JSON fixtures or MSW (Mock Service Worker).
Structure src/services/ so each function can swap from mock to real fetch with no component changes.
Keep auth state in React Context seeded with a mock JWT for now.