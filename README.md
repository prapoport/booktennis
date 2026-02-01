# Los Naranjos Court Reservations

A court reservation system for Los Naranjos HOA.

## Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Supabase Setup**
    - Create a new Supabase project.
    - Go to the SQL Editor and run the content of `supabase/migrations/001_initial_schema.sql`.
    - Retrieve your Project URL and Anon Key.

3.  **Environment Variables**
    - Copy `.env.example` to `.env`.
    - Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## Booking Rules
- **Max Active Bookings**: 2 per house per court.
- **Advance Window**: 7 days.
- **Cancellation**: Anytime.

## Tech Stack
- React + Vite
- Tailwind CSS
- Supabase (Postgres + RPC)
