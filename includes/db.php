<?php
/**
 * Database Connection
 * 
 * Establishes a PDO connection to the canteen_db database
 */

class Database {
    private $host = "localhost";
    private $db_name = "canteen_db";
    private $username = "root";
    private $password = "";
    private $conn;

    /**
     * Get the database connection
     * 
     * @return PDO|null The database connection or null on failure
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $e) {
            echo "Connection error: " . $e->getMessage();
        }

        return $this->conn;
    }
}
