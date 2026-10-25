# Damsel Booking — Nail Salon Booking App

A booking web app for Damsel Nails Studio clients. Customers choose a service, pick a date and time, and confirm their appointment in three simple steps.

**Live site:** https://booking-damselnails.netlify.app/

## Features

- **3-step booking flow**: Choose Service → Date & Time → Your Details
- **Live booking summary** showing the chosen service, price, duration and total
- **New-client discount** that is applied automatically to the price
- **Saved progress**: bookings and client details are kept in the browser's local storage
- **Gallery** of nail designs
- **AI Style Advisor**: describe what you want and get a suggested nail colour and nail art idea
- **Chat widget** where clients can ask the studio questions
- **Admin dashboard** where the owner logs in and edits services, nail artists and reviews without changing any code

## Built with

- HTML, CSS and JavaScript (no framework)
- [Supabase](https://supabase.com/) for the database, gallery photos and admin login
- Node.js + Express for a small backend server
- n8n for the AI style advisor, chat replies and booking notifications
- Front end deployed on Netlify, backend on Render

## How it works

- **The front end** (`index.html`, `app.js`, `style.css`) runs the booking steps, the summary and the discount logic.
- **Supabase**: when the page opens, it shows built-in default content straight away. It then loads the latest services, artists, reviews and gallery photos from Supabase. If Supabase can't be reached, the default content stays, so the page is never empty.
- **The Express server** (`backend/server.js`) sits between the website and n8n. Browsers block some requests to other websites (CORS), so the site sends requests to this server, and the server forwards them to n8n. It handles three things: booking notifications, style advice and chat messages.
- **Admin** (`admin.html`, `admin.js`): the owner logs in with Supabase Auth and can add, edit or delete services, artists and reviews.

## Run it locally

**Front end**
1. Download or clone this repo.
2. Open `index.html` in your browser.

**Backend (optional)**
1. Open a terminal in the `backend` folder.
2. Run `npm install`.
3. Run `node server.js`. The server starts on port 3000.
