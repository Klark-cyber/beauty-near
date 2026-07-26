# BeautyNear — Backend

> A scalable multi-role SaaS backend for discovering, booking, and managing K-Beauty salons across South Korea.

## Overview

The BeautyNear backend is a NestJS + GraphQL API powering a multi-role salon booking platform. It serves three distinct roles — Member, Salon Owner, and Admin — through a single, secure, schema-driven GraphQL API, with real-time chat handled over WebSocket.

## Key Features

### Member
- Search and browse salons
- View salon details and services
- Create and manage bookings
- Follow salons, like content
- Write reviews and comments
- Receive notifications
- Real-time chat with salon owners
- Profile management

### Salon Owner
- Create and update salon listings
- Create and update services
- Manage bookings (accept / cancel)
- Manage working hours and gallery
- View customer reviews
- Real-time chat with customers

### Admin
- Member management
- Salon owner management
- Salon approval and management
- Service management
- Booking monitoring
- Review moderation
- Payment monitoring
- Dashboard analytics
- Banner and event management
- Community post management
- Notification management

## Tech Stack

**Core:** NestJS, TypeScript, GraphQL, Apollo Server, MongoDB, Mongoose

**Auth & Security:** JWT authentication, bcrypt

**Real-time:** Socket.IO (WebSocket gateway)

**File handling:** Multer (image uploads)

## API Architecture

- GraphQL as the primary API for all business logic (queries, mutations)
- Role-scoped resolvers and guards separating Member / Salon Owner / Admin access
- WebSocket gateway for real-time chat, independent of the GraphQL transport

## Database

members, salons, services, bookings, boardArticles, comments, likes, follows, views, notifications, notices, faqs, inquiries

## Architecture Patterns

- MVC (Mongoose schemas / NestJS controllers-resolvers / service layer)
- Dependency Injection (NestJS's built-in IoC container)
- Middleware (cross-cutting request handling)
- Guards (role- and auth-based route protection)
- Decorators (NestJS metadata-driven resolvers, guards, and DTOs)

## Deployment

- Backend: DigitalOcean VPS (PM2, Nginx, SSL via Let's Encrypt)
- Session/token handling isolated per environment (development vs. production cookie policy)

## Development Workflow

- Git
- GitHub
- master / develop branches

## Project Highlights

- Multi-role SaaS architecture (Member / Salon Owner / Admin) on a single schema
- GraphQL-first API design
- Real-time chat via WebSocket, decoupled from the main API transport
- Modular, decorator-driven NestJS architecture
- Production deployment on a self-managed VPS with Nginx + SSL
