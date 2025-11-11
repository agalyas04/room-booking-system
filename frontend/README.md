# Room Booking System - Frontend

A modern React-based frontend for the Room Booking System.

## Features

- 🔐 User Authentication (Login/Register)
- 🏢 Room Management & Booking
- 📅 Calendar Integration
- 🔔 Real-time Notifications
- 📊 Analytics Dashboard (Admin)
- 🌙 Dark/Light Theme Toggle
- 📱 Responsive Design

## Tech Stack

- **React 18** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client
- **Socket.io** - Real-time Communication
- **Recharts** - Data Visualization
- **React Calendar** - Date Picker
- **React Toastify** - Notifications

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context providers
├── pages/              # Page components
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Environment Variables

- `VITE_API_URL` - Backend API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
