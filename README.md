# 🍴 Campus Canteen Menu System (Next.js Edition)

A modern, responsive CRUD (Create, Read, Update, Delete) application for managing and displaying canteen menus across multiple levels.

## 🏗️ The Tech Stack

| Component | Technology | Why? |
| --- | --- | --- |
| **Framework** | **Next.js 14+ (App Router)** | Provides Server Components for speed and Client Components for interactivity. |
| **Styling** | **Tailwind CSS** | Utility-first CSS for rapid, responsive UI development. |
| **Database** | **SQLite** | A lightweight, file-based database (similar to your PHP version). |
| **ORM** | **Prisma** | A type-safe way to interact with your database without writing raw SQL. |
| **Language** | **TypeScript** | Adds static typing to JavaScript to catch bugs early. |

---

## 📂 Project Structure

```text
canteen-app/
├── prisma/
│   └── schema.prisma    <-- Database definition
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── menu/
│   │   │       └── route.ts  <-- Backend logic (GET, POST, PUT, DELETE)
│   │   ├── admin/
│   │   │   └── page.tsx      <-- Admin dashboard (CRUD UI)
│   │   └── page.tsx          <-- Public menu display
│   └── lib/
│       └── prisma.ts         <-- Database connection client
└── .env                      <-- Environment variables

```

---

## 🛠️ Implementation Details

### 1. The Database (Prisma)

Instead of manually writing `CREATE TABLE`, we use a Prisma schema. This automatically generates a "Client" you can use to query data in your code.

```prisma
// prisma/schema.prisma
model MenuItem {
  id           Int      @id @default(autoincrement())
  name         String
  price        Float
  category     String   // Main Course, Dessert, etc.
  canteenLevel String   // Level 1, Level 2, Level 3
  createdAt    DateTime @default(now())
}

```

### 2. The API Route (Backend)

In Next.js, your backend logic lives in `route.ts`. It replaces the `if ($_SERVER['REQUEST_METHOD'] === 'POST')` logic from PHP.

* **GET:** Fetches menu items (filtered by level for the public site).
* **POST:** Adds a new food item.
* **PUT:** Updates an existing item.
* **DELETE:** Removes an item.

### 3. The Admin Panel (React)

The new Admin Panel uses **React State**.

* **No Refreshes:** When you add or delete an item, the list updates instantly using `fetch()` and `useState`.
* **Unified Form:** One form handles both adding and editing by switching between "Create" and "Update" modes dynamically.

### 4. The Public Site

* **Dynamic Filtering:** Clicking "Level 1" or "Level 2" updates the menu items immediately without a browser reload.
* **Responsive Grid:** Uses Tailwind’s `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` to look perfect on phones, tablets, and desktops.

---

## 🚀 How to Setup

1. **Initialize Project:**
```bash
npx create-next-app@latest canteen-app --typescript --tailwind --eslint
cd canteen-app

```


2. **Add Prisma (Database Tool):**
```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite

```


3. **Sync Database:**
After creating your `schema.prisma`, run:
```bash
npx prisma migrate dev --name init

```


4. **Run Development Server:**
```bash
npm run dev

```



---

## 💡 Key Differences from your PHP Code

1. **Client vs Server:** In PHP, the server generates the HTML and sends it. In Next.js, the server sends the data (JSON), and React builds the HTML on the user's screen.
2. **Routing:** Instead of `admin.php?edit=5`, Next.js uses clean folder-based routing and internal state management.
3. **Security:** Prisma automatically protects you from **SQL Injection**, which was a manual concern in raw PHP/PDO.
