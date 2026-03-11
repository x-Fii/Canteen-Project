# TODO: Final System Integration - Dynamic Day Filtering

## Task List

### Step 1: Update Database Schema
- [x] Add `unit_num` column to `menu_items` table
- [x] Add `unit_type` column to `menu_items` table
- [x] Add `day_to_display` column to `menu_items` table

### Step 2: Update index.php
- [x] Add PHP database connection
- [x] Add dynamic day-based SQL query using `date('l')`
- [x] Inline all CSS from styles.css
- [x] Create Hospital Directory UI structure:
  - [x] `.level` div for canteen level
  - [x] `.department` row for category headers
  - [x] `.doctor` cell for item name with unit display
  - [x] `.floor` cell for price (RM format)
- [x] Add `updateDateTime()` JavaScript function

### Step 3: Test the integration
- [x] Verify database changes
- [x] Verify PHP query works
- [x] Verify UI displays correctly
- [x] Verify clock logic works

