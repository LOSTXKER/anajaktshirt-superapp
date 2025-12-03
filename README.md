# Anajak Superapp 🏭

The Operational OS for Anajak T-Shirt Factory. A modular monolith application built with Next.js, Tailwind CSS, and Supabase.

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

1.  Go to your Supabase Project Dashboard > SQL Editor.
2.  Copy the contents of `supabase_schema.sql` (in the root folder).
3.  Run the script to create the tables (profiles, products, transactions, etc.).

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🏗️ Architecture

-   **Framework**: Next.js 14 (App Router)
-   **Database**: Supabase (PostgreSQL)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React

### Modules

-   **Stock**: Inventory management (Active)
-   **Production**: Order tracking (Placeholder)
-   **CRM**: Customer management (Placeholder)
