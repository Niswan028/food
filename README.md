# FarmTrace

FarmTrace is a blockchain-inspired agri supply chain and traceability platform designed for the SIH 2025 problem statement: Blockchain Supply Chain for Agri Produce.

It helps farmers, buyers, and administrators track produce from farm to table using a QR-based traceability flow, batch management, marketplace listings, and blockchain-style verification for every batch.

## Problem it solves

India's agricultural supply chain is often fragmented, opaque, and vulnerable to fraud, middlemen exploitation, and poor traceability. FarmTrace creates a digital trust layer for agricultural produce by enabling:

- transparent batch tracking
- verified farm onboarding
- direct farmer-to-buyer selling
- QR-based product traceability
- supply chain event logging
- blockchain-style verification for each batch

## Core features

- Farmer dashboard for listing produce batches
- Buyer marketplace with search and filters
- QR code traceability page for each batch
- Order workflow and order history
- Admin verification and platform activity dashboard
- Blockchain verification simulation using transaction-like metadata
- Responsive modern UI for desktop and mobile

## Tech stack

- React + Vite + TypeScript
- Tailwind CSS
- Framer Motion
- Express backend
- MongoDB Atlas-ready data layer
- QR code generation and display
- Local demo API fallback for quick runs

## Demo credentials

- Farmer: raghav.farmer@farmtrace.in / FarmTrace123!
- Buyer: rahul.buyer@farmtrace.in / FarmTrace123!
- Admin: admin@farmtrace.in / FarmTrace123!

## Run locally

1. Install dependencies:
   npm install

2. Start the app:
   npm run dev -- --host 0.0.0.0

3. Open the frontend in your browser:
   http://localhost:5175/

4. Backend health check:
   http://localhost:4000/api/health

## Environment

A sample environment file is available in:

- .env.example

Copy it to .env and update values if needed.

## Project structure

- src/ — frontend React app
- server/ — Express API backend
- public/ — static assets
- supabase/ — previous schema notes and SQL migrations

## SIH impact

FarmTrace contributes to:

- farmer income transparency
- reduced fraud and tampering in agri supply chains
- easier trust and traceability for buyers
- digital accountability across the entire produce journey

## Future improvements

- real Polygon/solidity smart contract integration
- secure JWT auth
- production MongoDB schemas and validation
- notifications and WhatsApp/SMS updates
- AI-based quality or demand prediction
- cold-chain monitoring and logistics analytics

## Status

This project is structured as a strong SIH demo with real product flows, modern UI, and a backend-ready architecture. It is ready for further enhancement toward a real deployment-level blockchain and supply-chain platform.
