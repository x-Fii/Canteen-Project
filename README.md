# 🍴 Campus Canteen Menu System

A modern, responsive CRUD application for managing and displaying canteen menus across multiple levels. Built with **Vite**, **React**, **TypeScript**, and **Firebase Firestore**.

---

## 🏗️ Tech Stack

| Component | Technology | Why? |
| --------- | ---------- | ----- |
| **Build Tool** | **Vite** | Fast bundling with HMR for smooth development |
| **Framework** | **React 18+** | Component-based UI with efficient rendering |
| **Language** | **TypeScript** | Type safety and better developer experience |
| **Styling** | **Tailwind CSS** | Utility-first CSS for rapid UI development |
| **UI Components** | **shadcn/ui** | Accessible, customizable components built on Radix UI |
| **Database** | **Firebase Firestore** | Serverless NoSQL with real-time sync |
| **Authentication** | **Firebase Auth** | Secure user authentication |
| **Backend Logic** | **Firebase Cloud Functions** | Server-side user management |
| **State Management** | **TanStack React Query** | Efficient server state caching |
| **Validation** | **Zod** | Schema validation with TypeScript support |

---

## 📂 Project Structure

```
canteen-project/
├── functions/                 # Firebase Cloud Functions
│   └── src/
│       ├── index.ts           # Function exports
│       └── admin.ts           # Admin-only functions
├── public/                     # Static assets
│   ├── icons/                 # PWA icons
│   └── manifest.json          # PWA manifest
├── src/
│   ├── components/
│   │   └── ui/                # shadcn-ui components (50+)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── firebase-new.ts    # Firebase config & hooks
│   │   ├── constants.ts      # App constants
│   │   ├── schemas.ts        # Zod validation schemas
│   │   └── utils.ts           # Utility functions
│   ├── pages/
│   │   ├── Index.tsx          # Public menu display
│   │   ├── Admin.tsx          # Admin panel
│   │   └── NotFound.tsx       # 404 page
│   ├── test/                  # Vitest tests
│   ├── App.tsx                # Main app with routing
│   └── main.tsx               # Entry point
├── .env                       # Environment variables
├── firebase.json              # Firebase config
├── tailwind.config.ts         # Tailwind config
├── vite.config.ts             # Vite config
└── package.json               # Dependencies
```

---

## 🛠️ Implementation Details

### 1. Firebase Firestore Schema

**menu_items collection:**
```
typescript
interface MenuItem {
  id: string;
  name: string;           // Food name
  price: number;          // Price in RM
  category: string;       // "Main Course" | "Dessert" | "Beverage" | "Snacks"
  canteen_level: string; // "Level 1" | "Level 2" | "Level 3"
  created_at: unknown;   // Firestore timestamp
}
```

**users collection:**
```
typescript
interface UserDoc {
  uid: string;
  email: string;
  role: "admin" | "content_manager";
  createdAt: unknown;
  lastSignInAt?: unknown;
}
```

### 2. React + shadcn-ui Usage

- **Dialog** for create/edit modals
- **Toast/Sonner** for notifications
- **Table** for admin menu listing
- **Select** for category/level dropdowns
- **Form** with react-hook-form + Zod validation

### 3. Dynamic Filtering

```
typescript
// Real-time filtering by canteen level
const q = query(
  collection(db, "menu_items"),
  where("canteen_level", "==", selectedLevel),
  orderBy("category"),
  orderBy("name")
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  // Real-time updates when data changes
});
```

---

## 🚀 Getting Started

### 1. Clone the Project

```
bash
git clone <your-repo-url>
cd canteen-project
```

### 2. Install Dependencies

```
bash
npm install
```

### 3. Configure Firebase

Create a `.env` file in the root directory:

```
env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Set Up Firestore Rules

```
javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menu_items/{item} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role in ['admin', 'content_manager'];
    }
    
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.token.role == 'admin';
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

### 5. Run Development Server

```
bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 💡 Key Features

- **📱 Responsive Design** - Works on mobile, tablet, and desktop
- **⚡ Real-time Updates** - Menu changes reflect instantly via Firestore listeners
- **🔐 Role-based Access** - Admin and Content Manager roles
- **🌙 Offline Support** - Shows offline indicator when connection lost
- **📺 TV Mode** - Add `?view=tv` to URL for TV display
- ** Testing🧪** - Vitest setup with React Testing Library

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

---

## 📄 License

MIT License - Feel free to use this project for your own canteen management system.
