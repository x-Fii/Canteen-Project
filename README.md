# Canteen Menu System

A complete Canteen Menu System built using a LAMP Stack (PHP 8, MySQL, Apache). This system includes a frontend for displaying menu items, an admin dashboard for managing menu items, and a database for storing the data.

## Features

- **Frontend**:
  - Modern, responsive design with shadcn/ui aesthetic
  - Level filtering (Level 1, 2, 3)
  - TV Mode for high-visibility display
  - Mobile-first layout

- **Admin Dashboard**:
  - Secure login with password hashing
  - Add, edit, and delete menu items
  - View all menu items in a table

- **API**:
  - RESTful API for menu items
  - Authentication API for login/logout

## Setup Instructions

### Prerequisites

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Apache web server
- XAMPP (recommended for easy setup)

### Installation

1. Clone the repository to your XAMPP htdocs folder:
   ```
   git clone https://github.com/yourusername/Canteen-Project.git
   ```

2. Create the database and tables by running the SQL script:
   ```
   mysql -u root -e "source sql/schema.sql"
   ```
   
   Or if using XAMPP:
   ```
   c:\xampp\mysql\bin\mysql -u root -e "source c:/xampp/htdocs/Canteen-Project/sql/schema.sql"
   ```

3. Access the application:
   - Frontend: http://localhost/Canteen-Project/
   - Admin Dashboard: http://localhost/Canteen-Project/admin/login.php

### Default Admin Credentials

- Username: admin
- Password: admin123

## Project Structure

- `sql/schema.sql`: Database schema and sample data
- `includes/db.php`: Database connection
- `api/menu.php`: REST API for menu items
- `api/auth.php`: Authentication API
- `assets/js/CanteenSystem.js`: Frontend JavaScript
- `assets/css/styles.css`: CSS styles
- `index.php`: Main frontend page
- `admin/login.php`: Admin login page
- `admin/dashboard.php`: Admin dashboard
- `admin/logout.php`: Logout functionality

## Browser Compatibility

This system is compatible with Chromium 87 and uses ES6 Classes for JavaScript but strictly avoids private class fields.

## Style Guide

The system uses Vanilla CSS throughout with a shadcn/ui aesthetic:
- Inter font
- Clean borders
- Minimal gray/white palette
- Responsive mobile-first layouts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
