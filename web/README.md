# Tour Booking Web

This is the Next.js web application for Tour Booking, designed to match the premium aesthetic of [Sri Sai Senthil Travels](https://srisaisenthiltravels.cloud/).

## Features
- **Premium Homepage**: Hero section, Stats, Services, and Fleet preview.
- **Fleet Search**: Browse available vehicles (Urbania, Volvo, Glider, etc.).
- **Authentication**: compatible with the existing ASP.NET Core API.
  - Member Login (`POST /api/Auth/login`)
  - Partner Registration (`POST /api/Auth/register`)

## Prerequisites
- Node.js 18+
- The Backend API running on `http://localhost:5115`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Configuration
The API URL is configured in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5115/api
```
Update this if your backend is running on a different port or host.
