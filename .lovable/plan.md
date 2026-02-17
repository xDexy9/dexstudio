

# GaragePro - AI Smart Workshop System
## Complete Implementation Plan

---

### Overview

GaragePro is an internal workshop management system for a small auto repair garage (5 mechanics + office staff). The system combines job scheduling, real-time communication, and AI-powered translation to streamline workshop operations across multiple languages.

**Tech Stack**: React + Supabase (database, auth, real-time, edge functions) + Lovable AI (Gemini-powered translation)

**Target Devices**: Mobile phones and tablets (touch-optimized, workshop-ready)

---

## Phase 1: MVP - Core System + AI Translation

### 1. Authentication & User Management
- Email/password registration with role selection (Office Staff or Mechanic)
- **Language preference prompt during registration** (English, French, Romanian, Portuguese)
- **In-app language selector** in settings for changing display language anytime
- Mobile-optimized login/registration forms
- Secure role-based access control (separate user_roles table)

### 2. Dashboard Views

**Office Staff Dashboard:**
- Overview cards showing job counts by status
- Quick-action buttons: Create Job, View Messages, Pending Parts
- Today's schedule with appointment timeline
- Unread message badge notifications
- Real-time status updates

**Mechanic Dashboard:**
- "Available Jobs" section with claimable jobs
- "My Jobs" section with active assignments
- Quick status update buttons (swipe or tap)
- Message notification indicators
- Large, touch-friendly card layout

### 3. Job Management

**Creating Jobs (Office Staff):**
- Customer name and phone number
- Vehicle selection or new vehicle entry
- Vehicle info: brand, model, year, license plate
- Problem description (free text)
- Priority level (Low, Normal, Urgent)
- Optional: known part codes

**Job Cards Display:**
- Color-coded status indicators
- Vehicle info at a glance
- Assigned mechanic name/avatar
- Time since creation
- Tap to expand details

**Job Workflow:**
- **Not Started** → Gray/neutral
- **In Progress** → Blue
- **Waiting for Parts** → Amber/orange
- **Completed** → Green

**Job Actions:**
- Mechanic can claim available jobs
- Mechanic updates status with single tap
- Office can reassign jobs
- View full vehicle history (past jobs)

### 4. Vehicle Management
- Vehicles linked to jobs
- Search by license plate
- Vehicle history showing all past repairs
- Quick vehicle info display on job cards

### 5. Internal Messaging System
- Per-job conversation threads
- Real-time message delivery (Supabase subscriptions)
- Photo/image attachments (mechanics snap issues)
- Message timestamps
- Unread message counters
- Original language indicator on messages

### 6. AI-Powered Translation (Gemini via Lovable AI)
- Automatic language detection on send
- Instant translation to recipient's preferred language
- Toggle to view original message text
- Translations cached for performance
- Edge function handles translation pipeline
- Supported: English ↔ French ↔ Romanian ↔ Portuguese

### 7. Settings & Preferences
- Change display language anytime
- Edit profile information
- Notification preferences
- Logout functionality

### 8. Mobile-First UI Design
- **Touch-optimized**: Large buttons, swipe gestures
- **Bottom navigation bar**: Dashboard, Jobs, Messages, Settings
- **Pull-to-refresh** on lists
- **Floating action button** for quick job creation
- Clean white backgrounds with colorful status accents
- Professional typography with clear hierarchy
- Status colors: Blue (active), Green (done), Amber (waiting), Gray (not started)

---

## Phase 2: AI Intelligence & Advanced Features

### 9. Message Intelligence Extraction
- AI extracts from mechanic messages:
  - Car brand/model/year mentions
  - Symptoms and issue descriptions
  - Urgency indicators
- Extracted data auto-populates job metadata

### 10. Smart Repair Assistance
- AI suggests possible faulty parts
- Repair type classification
- Parts checklist recommendations
- Estimated job duration
- Required tools list

### 11. Parts Order Management
- AI-generated order drafts from inspection notes
- Fields: part name, category, compatibility, urgency
- Office staff approval workflow
- Order status tracking
- Order history

### 12. CarCareKiosk Integration
- Manual reference mode: Direct links to vehicle/problem pages
- Optional AI mode: Paste content link for summarized repair steps
- AI extracts: steps, parts needed, tools, safety warnings

### 13. Analytics Dashboard
- Jobs completed per day/week/month
- Average completion times by repair type
- Mechanic workload distribution
- Parts usage trends

---

## Database Schema (Supabase/PostgreSQL)

### Core Tables (MVP)

**profiles**
- id (uuid, FK to auth.users)
- full_name (text)
- preferred_language (enum: en, fr, ro, pt)
- avatar_url (text, nullable)
- created_at, updated_at

**user_roles** (separate for security)
- id (uuid)
- user_id (FK to auth.users)
- role (enum: office_staff, mechanic)

**vehicles**
- id (uuid)
- brand, model, year
- license_plate (unique)
- created_at

**jobs**
- id (uuid)
- vehicle_id (FK)
- customer_name, customer_phone
- problem_description
- priority (enum: low, normal, urgent)
- status (enum: not_started, in_progress, waiting_for_parts, completed)
- assigned_mechanic_id (FK, nullable)
- created_by (FK)
- created_at, updated_at, completed_at

**messages**
- id (uuid)
- job_id (FK)
- sender_id (FK)
- original_text
- original_language (detected)
- translations (jsonb: {en: "", fr: "", ro: "", pt: ""})
- image_url (nullable)
- created_at

### Phase 2 Tables

**ai_suggestions**
- job_id, parts_suggested, tools_needed, repair_type, duration_estimate

**part_orders**
- job_id, part_name, category, compatibility, urgency, status, approved_by

---

## Design System

**Colors:**
- Primary Blue: #2563eb (actions, links)
- Success Green: #22c55e (completed)
- Warning Amber: #f59e0b (waiting for parts)
- Info Blue: #3b82f6 (in progress)
- Neutral Gray: #6b7280 (not started)
- Background: #ffffff, #f8fafc

**Typography:**
- Headings: Bold, clear hierarchy
- Body: 16px base for readability on mobile
- Status labels: Uppercase, small, color-coded badges

**Components:**
- Card-based layouts for jobs
- Bottom tab navigation
- Floating action buttons
- Pull-to-refresh lists
- Swipe actions on list items
- Modal sheets for quick edits

---

## Key User Journeys

**Registration Flow:**
1. Enter email, password
2. Select role (Office Staff / Mechanic)
3. Enter full name
4. **Choose preferred language**
5. Complete registration → Dashboard

**Office Creates Job:**
1. Tap "+" floating button
2. Enter customer info
3. Search/add vehicle
4. Describe problem
5. Set priority → Submit
6. Job appears in real-time for mechanics

**Mechanic Workflow:**
1. View available jobs on dashboard
2. Tap to see details → Claim job
3. Status auto-updates to "In Progress"
4. Send message with photo if needed (auto-translated)
5. Update status as work progresses
6. Mark complete when done

**Messaging with Translation:**
1. Mechanic types message in Romanian
2. System detects language, translates
3. Office staff sees French translation (their preference)
4. Office can toggle to see original Romanian
5. Office replies in French → Mechanic sees Romanian translation

---

## Implementation Phases

### Sprint 1: Foundation
- Project setup with Supabase integration
- Auth system with role selection
- Language preference during registration
- Basic responsive layout with bottom navigation

### Sprint 2: Core Features
- Profiles and user_roles tables
- Vehicles CRUD
- Jobs CRUD with status management
- Dashboard views for both roles

### Sprint 3: Real-Time & Messaging
- Job claiming system
- Real-time status updates (Supabase subscriptions)
- Basic messaging per job
- Image upload support

### Sprint 4: AI Translation
- Edge function for Gemini translation
- Language detection
- Translation caching
- Original/translated message toggle

### Sprint 5: Polish
- In-app language settings
- UI refinements for mobile
- Pull-to-refresh, swipe actions
- Testing and bug fixes

