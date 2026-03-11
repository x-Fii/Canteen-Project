-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS canteen_db;
USE canteen_db;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS users;

-- Create menu_items table with additional fields from the Firebase schema
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category ENUM('Main Course', 'Dessert', 'Beverage', 'Snacks') NOT NULL,
    canteen_level INT NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    unit_num INT DEFAULT 1,
    unit_type VARCHAR(50) DEFAULT 'Piece',
    day_to_display VARCHAR(20) DEFAULT 'Daily',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'content_manager') NOT NULL DEFAULT 'content_manager',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample menu items (one for each level)
INSERT INTO menu_items (name, price, category, canteen_level, description, is_available) VALUES
('Chicken Sandwich', 5.99, 'Snacks', 2, 'Freshly made chicken sandwich with lettuce and mayo', TRUE),
('Vegetable Pasta', 7.50, 'Main Course', 3, 'Pasta with seasonal vegetables in a light cream sauce', TRUE),
('Fresh Fruit Salad', 4.25, 'Dessert', 4, 'A mix of seasonal fruits with honey drizzle', TRUE);

-- Create default admin user (username: admin, password: admin123)
-- Password is encrypted using password_hash
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@canteen.local', '$2y$10$3VUESH5qja/2O9ML6N6YCOO3vrKxRr8kkkk2usUkS08bZmmmy6NxC', 'admin');
