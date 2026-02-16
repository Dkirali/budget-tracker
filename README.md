# Budget Tracker - Phase 1

A modern, responsive budget tracking application built with React, TypeScript, and LocalStorage.

## Features

### Core Features
- **Income & Expense Tracking** - Add transactions with categories and types
- **Dashboard** - View total income, expenses, money saved, and daily budget
- **Daily Budget Calculation** - Automatically calculated based on (Income - Mandatory Expenses) / Days in Month
- **Data Visualization** - Line chart showing income vs expense trends
- **Calendar View** - Visual calendar with daily transaction summaries
- **Responsive Design** - Works on mobile, laptop, and desktop screens

### Income Categories
- Salary
- Freelance
- Bonus
- Other

### Expense Categories
- Housing
- Food
- Business
- Transportation
- Utilities
- Other

### Expense Types
- **Mandatory** - Essential expenses (deducted from daily budget calculation)
- **Leisure** - Discretionary spending
- **Recurring** - Mark expenses as recurring

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **Lucide React** - Icons
- **LocalStorage** - Data persistence

## Project Structure

```
budget-tracker/
├── public/
│   └── logo.svg                 # Application logo
├── src/
│   ├── components/
│   │   ├── Navigation.tsx       # Top navigation bar
│   │   ├── Navigation.css
│   │   ├── TransactionForm.tsx  # Add transaction modal
│   │   └── TransactionForm.css
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main dashboard page
│   │   ├── Dashboard.css
│   │   ├── Calendar.tsx         # Calendar view page
│   │   └── Calendar.css
│   ├── services/
│   │   └── storage.ts           # LocalStorage service layer
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── calculations.ts      # Budget calculation utilities
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # Global styles
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Architecture Decisions

### Storage Service
- All LocalStorage access is encapsulated in `src/services/storage.ts`
- Components never access LocalStorage directly
- Clean separation between data layer and UI

### Type Safety
- Strict TypeScript configuration
- All data structures have explicit types
- Union types for transaction types and categories

### State Management
- React hooks (useState, useEffect) for local state
- No external state management library needed for Phase 1
- Data flows from LocalStorage → Service → Components

### Responsive Breakpoints
- **Mobile**: 360-430px - Single column, full-width cards
- **Tablet**: 768px - Adjusted layouts
- **Laptop**: 1024-1440px - Two-column layouts
- **Desktop**: 1920px+ - Max-width containers with larger spacing

## Daily Budget Formula

```
Daily Budget = (Total Income - Total Mandatory Expenses) / Days in Current Month
```

- Automatically recalculates when transactions change
- Only mandatory expenses are deducted
- Based on current month

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or create the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Default Landing Page
The Dashboard is set as the default landing page. The app will automatically redirect to `/` on startup.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Logo

The logo was designed with the following prompt for Nano Banana:

**Prompt:**
> "Minimal modern finance logo, wallet icon with dollar sign, blue gradient primary color (#3b82f6 to #2563eb), green accent (#10b981), clean geometric shapes, white background, professional fintech style, simple vector design, suitable for app icon"

**SVG Output:** Located at `public/logo.svg`

**PNG Export Instructions:**
1. Open `public/logo.svg` in a browser or SVG editor
2. Export as PNG at 512x512px for app icons
3. Export at 192x192px for web manifest
4. Export at 32x32px for favicon

## Responsive Design Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | 360-430px | Single column, stacked cards |
| Tablet | 768px | Adjusted grids |
| Laptop | 1024-1440px | Two-column dashboard |
| Desktop | 1920px+ | Max-width layout with expanded spacing |

## Future Enhancements (Phase 2+)

- Supabase integration for cloud storage
- User authentication
- Budget goals and alerts
- Export to CSV/PDF
- Recurring transaction automation
- Multi-currency support

## License

MIT
