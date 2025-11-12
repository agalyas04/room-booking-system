ROOM BOOKING LITE

Room Booking Lite is a full-stack meeting room booking and management system built with the MERN stack. This application provides a complete solution for organizational room reservations, real-time analytics, and administrative operations with advanced conflict prevention and accurate utilization tracking.

Table of Contents
   Features
   Technology Stack
   System design and architecture
   Key Challenges and Solutions
   Lessons Learned
   Future Enhancements

FEATURES

Authentication and Authorization
   JWT-based authentication with secure token management
   Role-based access control for Admin and Employee

Room Management
   Real-time availability tracking
   Admin-only room removal and creation with validation

Booking System
   Single and recurring bookings
   Interactive calendar interface
   Advanced overlap detection
   Email notifications for confirmations and cancellations

Analytics Dashboard for Admin
   Real-time analytics 
   Room utilization rates
   Popular time slots 

Notifications
   In-app notifications
   Real-time updates via Socket.IO



TECHNOLOGY STACK

BACKEND

* Node.js as the runtime environment
* Express.js as the web framework
* MongoDB as the NoSQL database
* Mongoose for object data modeling
* JWT for authentication
* bcryptjs for password hashing
* Socket.IO for real-time communication
* Moment.js for date and time handling

FRONTEND

* React for building the user interface
* Vite as the build and development tool
* Tailwind CSS for responsive styling
* React Router for navigation and routing
* Axios for making HTTP requests
* Recharts for data visualization and analytics
* Socket.IO Client for real-time updates and event handling



SYSTEM DESIGN

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                               │
│   React Single Page Application (Employee & Admin UI)               │
│   - Pages: Login, Dashboard, Analytics, Bookings, Rooms             │
│   - Components: Navbar, Charts, Modals, Room Cards                  │
│   - Contexts: AuthContext, Theme, Notifications                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
                      HTTP REST API + WebSocket
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER                             │
│        Node.js + Express Server + Socket.IO                         │
│                                                                     │
│        Layers:                                                      │
│         - Routing (auth, rooms, bookings, analytics)                │
│         - Middleware (JWT, RBAC, CORS, rate-limit, error handler)   │
│         - Controllers (business logic for all routes)               │
│         - Services (analyticsService, notificationService, etc.)    │
│         - Models (User, Room, Booking, RecurrenceGroup, Notif...)   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
                            Mongoose ODM
                                  ↕
┌─────────────────────────────────────────────────────────────────────┐
│                            DATA TIER                                │
│              MongoDB – NoSQL Database                               │
│              Collections: users, rooms, bookings,                   │
│              recurrencegroups, notifications, availability logs     │
└─────────────────────────────────────────────────────────────────────┘
```



Key Challenges and Solutions

Challenge 1 – Booking Overlap Detection
Users were able to book rooms that conflicted with existing recurring schedules. The team identified that the system wasn’t validating bookings based on recurring patterns.

Solution Found: 
Implemented an improved overlap detection logic with day-of-week validation, ensuring no two bookings can share the same time slot. This completely eliminated scheduling conflicts.

Challenge 2 – Incorrect Analytics
Analytics data was inconsistent due to overlapping time intervals being counted multiple times. The issue was traced to unmerged booking durations during aggregation.

Solution Found: 
Developed a centralized analytics service with interval merging. This unified data calculations, reduced duplicate counts, and made analytics both faster and more accurate.

Lessons Learned

1. Clear planning and validation prevent major logic errors later.
2. Real-time systems require accuracy, consistency, and strong testing.
3. Writing clean, modular code makes scaling and debugging much easier.


Future Enhancements

1. Integrate a real email notification system for booking confirmations and cancellations.
2. Add advanced filters across rooms based on capacity, amenities, and availability.
3. Improve the analytics module with more detailed usage insights and visual trends.

