# OLM Glasses Database Plan

This document explains the first PostgreSQL database plan for the OLM Glasses online store.

We are not using Supabase right now.  
We are starting with normal PostgreSQL files first, then later we can choose a host such as Railway, Neon, DigitalOcean, AWS, or another PostgreSQL provider.

---

## Goal

Move the project from temporary frontend storage to a real database.

Right now the project uses:

- `data/products.ts` for products
- `localStorage` for cart
- `localStorage` for orders
- `localStorage` for checkout customer data

Later, the real database will store:

- Products
- Product images
- Customers
- Orders
- Order items
- Prescriptions
- Inventory changes
- Admin users

---

## Main Tables

### 1. products

Stores all glasses products.

Example data:

- Product name
- Slug
- Description
- Price
- Type: eyeglasses or sunglasses
- Category
- Gender
- Shape
- Frame color
- Stock
- Active/inactive status

This table will replace `data/products.ts`.

---

### 2. product_images

Stores product image URLs.

Important: images should not be stored directly inside PostgreSQL.

The database should only store image links, such as:

- Main image URL
- Extra image URLs
- Display order

The actual image files can later be stored in another service.

---

### 3. customers

Stores customer information from checkout.

Example data:

- Full name
- Email
- Phone
- Address
- City
- State
- Zip code

---

### 4. orders

Stores one row per order.

Example data:

- Order number
- Customer ID
- Status
- Subtotal
- Shipping total
- Total
- Payment status
- Created date

Possible order statuses:

- pending
- processing
- completed
- cancelled

Possible payment statuses:

- unpaid
- pending
- paid
- failed
- refunded

---

### 5. order_items

Stores the products inside each order.

Example:

One customer order may contain:

- 1 Modelo Clásico
- 2 Sol Urbano

Each product in the order becomes one `order_items` row.

This table stores:

- Order ID
- Product ID
- Product name at time of purchase
- Unit price at time of purchase
- Quantity
- Lens option
- Prescription method

We store product name and price here too because prices may change later.

---

### 6. prescriptions

Stores prescription information for an order item.

Example data:

- Order item ID
- Prescription method
- File URL if customer uploads a prescription
- Notes
- Right eye sphere/cylinder/axis
- Left eye sphere/cylinder/axis
- PD value

This can be expanded later.

---

### 7. inventory_movements

Tracks stock changes.

Example:

- Admin adds 20 units
- Customer order removes 1 unit
- Admin corrects stock manually

This is useful because later we can see why stock changed.

---

### 8. admin_users

Stores admin accounts later.

At first, this may be simple. Later we can connect real login/auth.

Example roles:

- owner
- admin
- staff

---

## First Development Plan

### Phase 1: Database files only

Create plain PostgreSQL files:

- `database/schema.sql`
- `database/seed.sql`

No hosting yet.

---

### Phase 2: Local PostgreSQL or hosted PostgreSQL

Later we choose where to run the database:

- Local PostgreSQL on the computer
- Railway PostgreSQL
- Neon PostgreSQL
- DigitalOcean PostgreSQL
- AWS RDS
- Google Cloud SQL

---

### Phase 3: Connect Next.js to PostgreSQL

After the schema is ready, the website will stop using:

- `data/products.ts`
- `localStorage` orders

And start using real database queries.

---

### Phase 4: Add payments

After orders are saved in PostgreSQL, we can connect payment.

Possible payment provider for Mexico:

- Mercado Pago

Flow:

1. Customer places order
2. Order is saved in PostgreSQL
3. Customer pays with Mercado Pago
4. Payment status updates in database
5. Admin sees paid order

---

## Important Rules

### Do not store images inside PostgreSQL

PostgreSQL should store image URLs only.

Bad:

- Store image file directly in database

Good:

- Store image URL in database

---

### Do not edit frontend files while friend works on frontend

For this branch, focus on:

- `database/`
- `docs/`

This helps avoid Git conflicts.

---

## Current Branch

Current branch:

`alej-backend-database`

Purpose:

Build the first backend and PostgreSQL database structure.

