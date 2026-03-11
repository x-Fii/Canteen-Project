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

-- Insert sample menu items with day_to_display for dynamic filtering
-- 'Daily' items show every day
-- 'Wednesday' items show only on Wednesday

-- Level 2 Canteen Items
INSERT INTO menu_items (name, price, category, canteen_level, description, is_available, unit_num, unit_type, day_to_display) VALUES
('Chicken Sandwich', 5.99, 'Snacks', 2, 'Freshly made chicken sandwich with lettuce and mayo', TRUE, 1, 'Piece', 'Daily'),
('Nasi Lemak Set', 8.50, 'Main Course', 2, 'Coconut rice with sambal, chicken, and egg', TRUE, 1, 'Set', 'Wednesday'),
('Mee Goreng Mamak', 7.00, 'Main Course', 2, 'Fried noodles with shrimp and tofu', TRUE, 1, 'Bowl', 'Daily'),
('Milo Godzilla', 4.00, 'Beverage', 2, 'Large Milo with condensed milk', TRUE, 1, 'Cup', 'Daily'),
('Kuih Lapis', 2.50, 'Dessert', 2, 'Layered cake - 7 pieces', TRUE, 7, 'Piece', 'Wednesday');

-- Level 3 Canteen Items
INSERT INTO menu_items (name, price, category, canteen_level, description, is_available, unit_num, unit_type, day_to_display) VALUES
('Vegetable Pasta', 7.50, 'Main Course', 3, 'Pasta with seasonal vegetables in a light cream sauce', TRUE, 1, 'Bowl', 'Daily'),
('Roti Canai', 2.00, 'Snacks', 3, 'Flaky flatbread with dhal - 2 pieces', TRUE, 2, 'Piece', 'Wednesday'),
('Teh Tarik', 3.00, 'Beverage', 3, 'Pulled tea with condensed milk', TRUE, 1, 'Cup', 'Daily'),
('Fried Rice', 6.50, 'Main Course', 3, 'Egg fried rice with chicken', TRUE, 1, 'Plate', 'Wednesday');

-- Level 4 Canteen Items
INSERT INTO menu_items (name, price, category, canteen_level, description, is_available, unit_num, unit_type, day_to_display) VALUES
('Fresh Fruit Salad', 4.25, 'Dessert', 4, 'A mix of seasonal fruits with honey drizzle', TRUE, 1, 'Bowl', 'Daily'),
('Waffle Platter', 9.00, 'Dessert', 4, '2 Belgian waffles with ice cream', TRUE, 2, 'Piece', 'Wednesday'),
('Iced Lemon Tea', 3.50, 'Beverage', 4, 'Fresh brewed lemon tea', TRUE, 1, 'Glass', 'Daily'),
('Chicken Chop', 10.00, 'Main Course', 4, 'Grilled chicken with peppercorn sauce', TRUE, 1, 'Piece', 'Wednesday');

-- Create default admin user (username: admin, password: admin123)
-- Password is encrypted using password_hash
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@canteen.local', '$2y$10$3VUESH5qja/2O9ML6N6YCOO3vrKxRr8kkkk2usUkS08bZmmmy6NxC', 'admin');
