# Backend API URLs

Base URL
- http://127.0.0.1:5000

## Auth
- POST /api/auth/register
- GET /api/auth/user/:uid
- POST /api/auth/user/:uid/vehicles
- GET /api/auth/user/:uid/vehicles
- PUT /api/auth/user/:uid/vehicles/:vehicle_id/default

## Bookings
- POST /api/bookings/
- GET /api/bookings/user/:user_id
- PUT /api/bookings/:booking_id/cancel
- PUT /api/bookings/:booking_id/delay

## Queue
- POST /api/queue/join
- GET /api/queue/port/:port_id
- PUT /api/queue/:entry_id/delay
- PUT /api/queue/:entry_id/noshow

## Ports
- POST /api/ports/
- GET /api/ports/
- PUT /api/ports/:port_id/status
- DELETE /api/ports/:port_id

## Notifications
- POST /api/notifications/
- GET /api/notifications/user/:user_id
- PUT /api/notifications/:notification_id/read
- DELETE /api/notifications/:notification_id

## Sessions
- POST /api/sessions/start
- PUT /api/sessions/:session_id/end
- GET /api/sessions/user/:user_id
- GET /api/sessions/port/:port_id

## Violations
- POST /api/violations/
- GET /api/violations/user/:user_id
- DELETE /api/violations/:violation_id

## Frontend wiring already in place
- Frontend env base URL: /api
- Vite proxy target: http://127.0.0.1:5000
