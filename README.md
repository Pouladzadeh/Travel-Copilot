# HelloWorld · Travel Copilot

A hotel booking site with **Travel Copilot**, an assistant in a side panel that checks stays against the traveler's requirements and shows its evidence. Portfolio project by Parvaneh (Peri) Pouladzadeh.

> **Sample data.** Every hotel, price, review count, booking and photo in this app is invented for the portfolio. Photos are AI-generated.

## Status

This branch (`redesign-2026`) is a full rebuild from the 2026 Figma design. The original Stanford course build stays on `main` as the "before".

- [x] Design tokens and core components (`/design-system`)
- [ ] Home, Results with Copilot panel, Hotel detail, Compare, Booking, Confirmation, Trip, Manage booking
- [ ] Small screens: How Copilot ranks stays, My data, Report an answer, Message the hotel
- [ ] Mobile: Home, Results with Copilot sheet, Booking
- [ ] Evals (real runs only) and evals dashboard

## Source of truth

The Figma file **Travel Copilot 2026** decides layout, flow, copy, components and Copilot behaviour. Tokens in `src/styles/tokens.css` mirror its variables one to one.

## Run it

```bash
npm install
npm run dev
# http://localhost:3000
```

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4 mapped onto the Figma tokens, Inter.
