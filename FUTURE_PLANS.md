# Gaadieasy — Future Plans

A running list of planned features and improvements. Add notes as ideas come up.

---

## 1. Experience page — Discussion forum upgrade

**What:** Turn the experiences page dealer posts into a discussion thread. Users can reply to any experience post, and posts/replies can be upvoted or downvoted.

**Details:**
- Flat replies only (no nested threading) — keeps it clean for dealer review context
- Two new DB tables needed:
  - `experience_replies` — `id, experience_id, parent_reply_id (nullable), reviewer_name, reviewer_email, body, active, created_at`
  - `experience_votes` — `id, target_type ("experience"|"reply"), target_id, vote (+1|-1), voter_fingerprint, created_at`
- Vote integrity: browser-fingerprint (localStorage UUID) now, upgrade to verified email later
- Sort options on hub page: Most recent / Most upvoted / Most discussed
- SEO benefit: dealer pages with replies become richer — more unique content indexed per URL

**Effort estimate:** ~1 day
- DB tables + RLS: 30 min
- Reply API + service: 2 hrs
- Vote API + service: 1 hr
- Reply UI on dealer page: 3 hrs
- Vote buttons: 2 hrs
- Sort by votes on hub: 1 hr

---

## 2. Email verification for reviews and experiences

**What:** Verify reviewer email before marking a review/experience as `email_verified = true`. Verified reviews get a checkmark badge and rank higher.

**Details:**
- `verification_token` column already exists in both `vehicle_reviews` and `experiences` tables
- Flow: submit → send OTP email → user clicks link → mark verified
- Need: email sending service (Resend / SendGrid), a `/api/verify-review?token=xxx` route, and a triggered email on POST
- Verified reviews can be weighted higher in sort order

**Effort estimate:** ~1 day

---

## 3. Brand overview / SEO pages

**What:** Full brand landing pages with overview text, tagline, SEO title/description.

**Details:**
- DB columns already added: `overview`, `tagline`, `seo_title`, `seo_description` on `brands` table
- SQL migration still needs to be run if not done:
  ```sql
  ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS overview text,
    ADD COLUMN IF NOT EXISTS tagline text,
    ADD COLUMN IF NOT EXISTS seo_title text,
    ADD COLUMN IF NOT EXISTS seo_description text;
  ```
- Admin UI for editing brand overview is needed

---

## 4. Admin moderation panel for experiences/reviews

**What:** Admin interface to review, approve, reject, or merge dealer experience posts.

**Details:**
- Flag/report button on experience cards for users
- Admin panel page listing unmoderated/flagged posts
- Ability to deactivate (`active = false`) posts from admin
- Dealer slug merging — if two users wrote "Hero Motocorp Koramangala" and "Hero MotoCorp – Koramangala", admin can assign the same canonical slug

---

## 5. Dealer profile pages

**What:** Official dealer profile pages (separate from user-submitted experience slugs) linked to the existing `dealers` DB table.

**Details:**
- `/dealers/[city]/[brand]/[slug]` — official page with address, contact, Google Maps embed, and linked experience reviews
- Dealers can claim their profile (future)
- Connect to existing `dealers`, `dealer_businesses`, `dealer_brand_mappings` tables

---

## 6. Compare page improvements

**What:** Make the compare page more visual and shareable.

**Details:**
- Share comparison via URL (already URL-based)
- Side-by-side spec difference highlighting (green = better, red = worse)
- Add EV range and charging to compare view
- Print / PDF export of comparison

---

## 7. City-level experience pages

**What:** `/experiences/city/[city-slug]` pages aggregating all dealer reviews in a city.

**Details:**
- Good for SEO: "Delhi vehicle dealer reviews", "Bangalore dealer experiences"
- Filter by brand within city
- Top-rated dealers leaderboard per city

---
