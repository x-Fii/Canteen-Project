# Canteen Menu System

A complete Canteen Menu System built using a LAMP Stack (PHP 8, MySQL, Apache). This system includes a frontend for displaying menu items, an admin dashboard for managing menu items, and a database for storing the data.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌─────────────────────────────┐ │
│  │   Frontend      │         │      Admin Dashboard        │ │
│  │   (index.php)   │         │    (admin/dashboard.php)    │ │
│  └────────┬─────────┘         └──────────────┬──────────────┘ │
│           │                                    │               │
│           └──────────────┬─────────────────────┘               │
│                          │                                     │
│                          ▼                                     │
│              ┌───────────────────────┐                          │
│              │      API Layer       │                          │
│              │  (api/menu.php)      │                          │
│              │  (api/auth.php)       │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SERVER (PHP + Apache)                       │
│  ┌─────────────────┐          ┌──────────────────────────────┐   │
│  │  PHP Processing │          │     MySQL Database           │   │
│  │  - Sessions     │          │  ┌─────────────────────────┐ │   │
│  │  - Auth         │          │  │  menu_items table       │ │   │
│  │  - CRUD ops     │          │  │  (id, name, price,      │ │   │
│  └─────────────────┘          │  │  category, level,       │ │   │
│                               │  │  day_to_display...)     │ │   │
│                               │  └─────────────────────────┘ │   │  
│                               │  ┌─────────────────────────┐ │   │
│                               │  │  users table            │ │   │
│                               │  │  (id, username,         │ │   │
│                               │  │  password, role...)     │ │   │
│                               │  └─────────────────────────┘ │   │
│                               └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Canteen-Project/
├── index.php                    # Main frontend page (canteen menu display)
├── README.md                    # This file
├── TODO.md                      # Project todo list
├── verify_password.php          # Legacy password verification utility
│
├── admin/                       # Admin dashboard section
│   ├── login.php                # Admin login page
│   ├── dashboard.php           # Main admin dashboard (CRUD for items & users)
│   └── logout.php              # Logout handler
│
├── api/                        # REST API endpoints
│   ├── menu.php                # Menu items API (GET/POST/PUT/DELETE)
│   └── auth.php                # Authentication API (login/logout/user management)
│
├── assets/                     # Frontend resources
│   ├── css/
│   │   └── styles.css          # Global styles
│   └── js/
│       └── CanteenSystem.js    # Frontend JavaScript (if needed)
│
├── includes/                   # Shared PHP components
│   └── db.php                 # Database connection class (PDO)
│
├── sql/                        # Database files
│   └── schema.sql             # Database schema + sample data
│
└── _legacy_react_backup/      # Deprecated React frontend (not in use)
```

---

## 🗄️ Database Schema

### `menu_items` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Auto-increment primary key |
| `name` | VARCHAR(255) | Item name |
| `price` | DECIMAL(10,2) | Price in Malaysian Ringgit |
| `category` | ENUM | Main Course, Dessert, Beverage, Snacks |
| `canteen_level` | INT | Level 2, 3, or 4 |
| `description` | TEXT | Optional description |
| `is_available` | BOOLEAN | Whether item is currently available |
| `unit_num` | INT | Quantity (e.g., 2 pieces) |
| `unit_type` | VARCHAR(50) | Unit type (Piece, Set, Bowl, Cup, etc.) |
| `day_to_display` | VARCHAR(20) | Daily, Monday, Tuesday, ..., Sunday |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `users` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | INT (PK) | Auto-increment primary key |
| `username` | VARCHAR(50) | Unique username |
| `email` | VARCHAR(100) | User email |
| `password` | VARCHAR(255) | bcrypt hashed password |
| `role` | ENUM | admin, content_manager |
| `last_login` | TIMESTAMP | Last login time |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

## 🎨 Visual Design & Layout

### Frontend (index.php) - Hospital Directory Style

The frontend uses a **hospital directory aesthetic** with Chinese imperial colors:

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  🏠 LEVEL 2                    ⏰ 12:30 PM               ║  │
│  ║  CANTEEN                      📅 Wednesday, Jan 15, 2025  ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
├─────────────────────────────────────────────────────────────────┤
│  ═════════════════════════════════════════════════════════════  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🍛 MAIN COURSE                                             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Nasi Lemak Set           ......................... RM 8.50 ││
│  │  1 Set                                                      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Mee Goreng Mamak        .......................... RM 7.00 ││
│  │  1 Bowl                                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🍔 SNACKS                                                  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Chicken Sandwich       ........................... RM 5.99 ││
│  │  1 Piece                                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📺 CANTEEN MENU SYSTEM                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Color Palette (Chinese Imperial Aesthetic)
- **Imperial Red**: `#8B0000` (primary color, headers)
- **Gold**: `#D4AF37` (accents, borders)
- **Cream**: `#FFF8DC` (background)
- **Dark Brown**: `#3D2914` (text)

#### Key Features
- **Level Badge**: Circular badge showing current canteen level (L2, L3, L4)
- **Live Clock**: Real-time clock and date display
- **Category Headers**: Red background with white text
- **Two-Column Layout**: Item name (left), Price (right)
- **Responsive**: Works on TV displays and mobile devices

---

### Admin Dashboard (admin/dashboard.php)

```
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                                │
│  ┌───────────────┬─────────────────────────────────────────────┐│
│  │               │                                             ││
│  │  Welcome,    │  ┌─────────────────────────────────────────┐││
│  │  admin!      │  │  Manage Menu Items                      │││
│  │               │  │  ┌─────────────────────────────────┐   │││
│  │  [View Menu] │  │  │ Add New Item Form               │   │││
│  │               │  │  │ Name: [________]               │   │││
│  │  [Logout]    │  │  │ Price: [________]              │   │││
│  │               │  │  │ Category: [Dropdown]          │   │││
│  │               │  │  │ Level: [Dropdown]             │   │││
│  │               │  │  │ Day: [Dropdown]               │   │││
│  │               │  │  │              [Add Item]        │   │││
│  │               │  │  └─────────────────────────────────┘   │││
│  │               │  │                                         │││
│  │               │  │  ┌─────────────────────────────────┐   │││
│  │               │  │  │ All Menu Items Table            │   │││
│  │               │  │  │ ID | Name | Price | Level | ...  │   │││
│  │               │  │  │ 1  | Nasi | 8.50  | L2   | [Edit]│   │││
│  │               │  │  │ 2  | Milo | 4.00  | L2   | [Edit]│   │││
│  │               │  │  └─────────────────────────────────┘   │││
│  │               │  └─────────────────────────────────────────┘││
│  └───────────────┴─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Admin Features
- **Sidebar Layout**: Red sidebar with gold accents
- **Menu Management**: Add, Edit, Delete menu items
- **User Management**: Admin-only user CRUD (add/edit/delete users)
- **Modal Forms**: Inline editing via JavaScript modals
- **Form Grid**: Organized form fields for unit_num, unit_type, day_to_display

---

## 🔄 How It Works

### 1. Frontend Display Flow

```
User visits index.php
        │
        ▼
PHP gets ?level= parameter (default: 2)
        │
        ▼
PHP gets current day (date('l'))
        │
        ▼
SQL Query:
  SELECT * FROM menu_items 
  WHERE canteen_level = ? 
  AND (day_to_display = ? OR day_to_display = 'Daily')
  AND is_available = TRUE
        │
        ▼
PHP renders HTML table grouped by category
        │
        ▼
Browser displays hospital directory style menu
```

### 2. Level Filtering
- **URL**: `index.php` - Shows Level 2 (default)
- **URL**: `index.php?level=3` - Shows Level 3
- **URL**: `index.php?level=4` - Shows Level 4

### 3. Day Filtering
Items have `day_to_display` field:
- `'Daily'` - Shows every day
- `'Wednesday'` - Shows only on Wednesdays
- etc.

### 4. Admin Authentication Flow

```
Admin visits admin/login.php
        │
        ▼
Enter username/password
        │
        ▼
POST to login.php (or api/auth.php)
        │
        ▼
PHP verifies password with password_verify()
        │
        ▼
Set $_SESSION['user_id'], $_SESSION['username'], $_SESSION['role']
        │
        ▼
Redirect to admin/dashboard.php
        │
        ▼
Dashboard checks $_SESSION['role'] for permissions
```

### 5. API Usage

#### GET Menu Items (Public)
```
GET api/menu.php?level=2
Response: [{"id":1,"name":"Nasi Lemak","price":8.50,...},...]
```

#### POST Menu Item (Admin/Content Manager only)
```
POST api/menu.php
Body: {"name":"Test","price":5.00,"category":"Snacks","canteen_level":2}
```

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access: manage menu items + manage users |
| `content_manager` | Manage menu items only (cannot access user management) |

---

## 🚀 Setup Instructions

### Prerequisites
- PHP 8.0 or higher
- MySQL 5.7 or higher
- Apache web server
- XAMPP (recommended for easy setup)

### Installation

1. **Clone the repository** to your XAMPP htdocs folder:
   ```bash
   git clone https://github.com/yourusername/Canteen-Project.git
   ```

2. **Create the database and tables**:
   ```bash
   mysql -u root -e "source sql/schema.sql"
   ```
   
   Or if using XAMPP on Windows:
   ```cmd
   c:\xampp\mysql\bin\mysql -u root -e "source c:/xampp/htdocs/Canteen-Project/sql/schema.sql"
   ```

3. **Access the application**:
   - Frontend: http://localhost/Canteen-Project/
   - Admin Dashboard: http://localhost/Canteen-Project/admin/login.php

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

---

## 🔧 Key Files Reference

| File | Purpose |
|------|---------|
| `index.php` | Main frontend - displays menu by level |
| `admin/login.php` | Admin login page |
| `admin/dashboard.php` | Admin CRUD operations |
| `admin/logout.php` | Destroys session |
| `api/menu.php` | REST API for menu items |
| `api/auth.php` | REST API for authentication |
| `includes/db.php` | PDO database connection class |
| `sql/schema.sql` | Database schema + sample data |
| `assets/css/styles.css` | All styling (inline in PHP files + this) |

---

## 🌐 Browser Compatibility

- **Target**: Chromium 87+ (Chrome, Edge, Opera)
- **JavaScript**: ES6 Classes (no private class fields for compatibility)
- **No external dependencies**: Vanilla CSS and JS only

---

## 📝 Style Guide

- **Font**: Inter (system fallback: Arial, Helvetica)
- **Design System**: Vanilla CSS with shadcn/ui-inspired aesthetic
- **Layout**: Mobile-first, responsive
- **Theme**: Chinese imperial (red/gold/cream)

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
