# Agent Instructions

Read this entire file before starting any task.

This project is a **Next.js (App Router) + TypeScript headless frontend** connected to a **WordPress + WooCommerce backend**.

The site uses WooCommerce APIs for product data and a custom special-order workflow.

Agents must follow the architecture and coding rules defined here.

---

# Project Architecture

Frontend stack

- Next.js (App Router)
- TypeScript
- React
- TailwindCSS

Backend

- WordPress
- WooCommerce

Headless integration

Frontend fetches product data directly from WooCommerce APIs.

Two APIs are used:

Store API (public):

/wp-json/wc/store/v1

REST API (authenticated):

/wp-json/wc/v3

The REST API is accessed through a **Next.js server API proxy** for security.

Example proxy route

/app/api/product-shipping/[id]/route.ts

Never expose WooCommerce credentials to the browser.

---

# Environment Variables

Local development requires these variables in `.env.local`.

WORDPRESS_URL=https://creality.com.kw/site

WC_CONSUMER_KEY=...
WC_CONSUMER_SECRET=...

NEXT_PUBLIC_WC_API=/site/wp-json/wc/store/v1
NEXT_PUBLIC_WC_BASE_URL=https://creality.com.kw/site

SESSION_SECRET=...

Rules

Never expose WC_CONSUMER_KEY or WC_CONSUMER_SECRET to the browser.

Only server API routes may use them.

---

# Package Manager

Use **npm**.

Do not switch to pnpm, yarn, or bun.

---

# WooCommerce Data Rules

Frontend product data comes from

/wp-json/wc/store/v1/products

Important fields returned

is_in_stock  
stock_status  
stock_quantity

Possible values for stock_status

instock  
outofstock  
onbackorder

Always rely on **stock_status** to determine availability.

Do not trust `is_in_stock` alone.

Correct logic

instock → Available  
outofstock → Special Order  
onbackorder → Special Order

---

# Special Order System

Products that are out of stock are still purchasable as **Special Orders**.

Special order behavior

User clicks Special Order  
Order policy modal appears  
User must accept terms  
Product is added to cart

The modal also shows

Estimated lead time: 10–12 days

and

Special order delivery charge (calculated from weight + size)

Delivery fee is calculated using product shipping data.

Shipping data is retrieved using

/wp-json/wc/v3/products/{id}

through the server proxy route

/api/product-shipping/[id]

---

# Product Card Rules

Product cards must follow the same UI across the site.

Required elements

Product image  
Product title  
Price  
Stock message  
Action button  
Delivery notice (if special order)

Rules

Never show "Learn More" on grid cards.

Grid cards must show

Add to Cart (if available)

or

Special Order (if out of stock)

Stock messages

Available → Add to Cart

Out of stock → "Currently out of stock"

Special order products show

Delivery 10–12 days

---

# Pricing Format

Currency format must always be

60.00 KWD

Never

KWD 60.00

Formatting helper must enforce this.

---

# Image Handling

All product images must scale consistently.

Use

object-fit: contain

Do not crop product images.

Images must always fit inside their containers.

---

# Carousel Rules

The homepage hero carousel must support

Swipe left/right on mobile

Dots navigation

Autoplay

Swiping must change slides, not just the dots.

---

# API Security Rules

Never call

/wp-json/wc/v3

directly from the frontend.

Always use a server API route.

Example

/app/api/product-shipping/[id]

Server routes may use WooCommerce credentials.

Frontend must never see them.

---

# Debugging Rules

When debugging product availability always log

product.name  
product.stock_status  
product.stock_quantity  
product.is_in_stock

Example debug

console.log("Stock debug", {
  name: product.name,
  stock_status: product.stock_status,
  stock_quantity: product.stock_quantity,
  is_in_stock: product.is_in_stock
})

---

# Development Rules

Before implementing features

Check WooCommerce API responses.

Never assume field names.

Always confirm API shape.

Example

/wp-json/wc/store/v1/products

---

# UI Consistency Rules

All product grids must reuse the same ProductCard component.

Never duplicate product card implementations.

Shared components must live in

/components/

---

# Deployment

Frontend is deployed on Netlify.

Backend is WordPress + WooCommerce.

---

# Self-Correcting Rules Engine

This file contains a growing ruleset that improves over time.

At session start, read the entire "Learned Rules" section before doing anything.

If a mistake occurs, append a new rule to the list below.

Rules are numbered sequentially.

Format

N. [CATEGORY] Always/Never do X — because Y.

Categories

STYLE  
CODE  
ARCH  
TOOL  
PROCESS  
DATA  
UX  
OTHER

If two rules conflict, the newest rule wins.

Never delete rules.

Only append.

---

# Project File Map

Important project files and their responsibilities.

Do not duplicate logic already implemented in these files.

lib/productLogic.ts

Responsible for:

Product availability logic  
Stock status mapping  
Special order detection

components/ProductCard.tsx

Responsible for:

Rendering product cards across the entire site.

All product grids must reuse this component.

Never create alternative card components.

components/ProductGrid.tsx

Responsible for:

Rendering grid layout for product cards.

Grid columns

mobile: 2  
tablet: 3  
desktop: 4

components/OrderWarningModal.tsx

Responsible for:

Special order confirmation modal.

Displays

Order policy  
Delivery lead time  
Special order delivery charge

lib/specialOrderPricing.ts

Responsible for:

Calculating delivery fee based on

weight  
dimensions

Formula

(weight * 0.75) + ((length * width * height) / 5000 * 0.5)

app/api/product-shipping/[id]/route.ts

Server API proxy that fetches shipping data from WooCommerce.

Uses

/wp-json/wc/v3/products/{id}

Never call WooCommerce REST API directly from the frontend.

---

# Project File Map

Important project files and their responsibilities.

Do not duplicate logic already implemented in these files.

lib/productLogic.ts

Responsible for:

Product availability logic  
Stock status mapping  
Special order detection

components/ProductCard.tsx

Responsible for:

Rendering product cards across the entire site.

All product grids must reuse this component.

Never create alternative card components.

components/ProductGrid.tsx

Responsible for:

Rendering grid layout for product cards.

Grid columns

mobile: 2  
tablet: 3  
desktop: 4

components/OrderWarningModal.tsx

Responsible for:

Special order confirmation modal.

Displays

Order policy  
Delivery lead time  
Special order delivery charge

lib/specialOrderPricing.ts

Responsible for:

Calculating delivery fee based on

weight  
dimensions

Formula

(weight * 0.75) + ((length * width * height) / 5000 * 0.5)

app/api/product-shipping/[id]/route.ts

Server API proxy that fetches shipping data from WooCommerce.

Uses

/wp-json/wc/v3/products/{id}

Never call WooCommerce REST API directly from the frontend.

---

# Project File Map

Important project files and their responsibilities.

Do not duplicate logic already implemented in these files.

lib/productLogic.ts

Responsible for:

Product availability logic  
Stock status mapping  
Special order detection

components/ProductCard.tsx

Responsible for:

Rendering product cards across the entire site.

All product grids must reuse this component.

Never create alternative card components.

components/ProductGrid.tsx

Responsible for:

Rendering grid layout for product cards.

Grid columns

mobile: 2  
tablet: 3  
desktop: 4

components/OrderWarningModal.tsx

Responsible for:

Special order confirmation modal.

Displays

Order policy  
Delivery lead time  
Special order delivery charge

lib/specialOrderPricing.ts

Responsible for:

Calculating delivery fee based on

weight  
dimensions

Formula

(weight * 0.75) + ((length * width * height) / 5000 * 0.5)

app/api/product-shipping/[id]/route.ts

Server API proxy that fetches shipping data from WooCommerce.

Uses

/wp-json/wc/v3/products/{id}

Never call WooCommerce REST API directly from the frontend.

---

# Safe Refactoring Rules

Agents must follow these constraints when modifying code.

Never change WooCommerce API endpoints unless necessary.

Never expose WooCommerce credentials in frontend code.

Never duplicate the ProductCard component.

Always reuse existing components.

Never remove debugging logs unless the user asks.

Never modify environment variables automatically.

Never refactor product availability logic without verifying WooCommerce API data.

Always confirm API response structure before implementing new logic.

Do not introduce new state management libraries.

Use existing project patterns.

---

# WooCommerce Data Contract

This section defines the expected structure of WooCommerce API responses.

Agents must follow these contracts when reading product data.

Do not assume field names without verifying them against this contract.

---

## Store API Product

Products used in the frontend are fetched from

/wp-json/wc/store/v1/products

Example response

{
  "id": 41745,
  "name": "K2 Pro PEI Double Sided Frosted Build Plate",
  "slug": "k2-pro-pei-double-sided-frosted-build-plate",

  "prices": {
    "price": "1000",
    "regular_price": "1000",
    "sale_price": null,
    "currency_code": "KWD"
  },

  "images": [
    {
      "id": 100,
      "src": "https://example.com/image.jpg",
      "alt": ""
    }
  ],

  "stock_status": "instock",
  "is_in_stock": true,
  "stock_quantity": 10,

  "permalink": "https://example.com/product/k2-pro-pei-double-sided-frosted-build-plate/"
}

Important fields

id → WooCommerce product ID  
name → product title  
prices.price → current price (minor units)  
stock_status → instock | outofstock | onbackorder  
stock_quantity → inventory count  
images → product images  

---

## Product Availability Rules

Agents must implement availability using this logic.

stock_status = "instock"

→ Product is available  
→ Show Add to Cart

stock_status = "outofstock"

→ Product is unavailable  
→ Show Special Order

stock_status = "onbackorder"

→ Treat as Special Order

Never rely solely on is_in_stock.

---

## WooCommerce REST API Product

Shipping data must be retrieved using

/wp-json/wc/v3/products/{id}

Example response

{
  "id": 41745,

  "weight": "13.5",

  "dimensions": {
    "length": "650",
    "width": "460",
    "height": "560"
  }
}

Fields used for special order delivery fee calculation

weight  
dimensions.length  
dimensions.width  
dimensions.height  

---

## Special Order Delivery Fee

Delivery fee is calculated using

(weight * 0.75) + ((length * width * height) / 5000 * 0.5)

Result must be displayed in

KWD

Example

Special order delivery charge: 7.50 KWD

Delivery fee must only appear in the Special Order modal.

Do not show delivery fees on product cards.

---

## Currency Formatting

Prices must always follow this format

60.00 KWD

Never

KWD 60.00

Always append currency after the amount.

---

## Image Handling

Product images must be rendered with

object-fit: contain

Images must never be cropped.

All product images must fit within card containers.

---

## API Access Rules

Frontend may access

/wp-json/wc/store/v1

directly.

Frontend must never access

/wp-json/wc/v3

directly.

The WooCommerce REST API requires authentication.

It must be accessed only through server proxy routes.

Example

/app/api/product-shipping/[id]

---

## API Debugging

When debugging product data always log

console.log("Woo product", {
  id: product.id,
  name: product.name,
  stock_status: product.stock_status,
  stock_quantity: product.stock_quantity
})

Never assume field names.

Always verify API responses before implementing logic.

---

# Manager Requirements

The following rules come directly from project management requirements.

Agents must follow these rules when implementing UI or business logic.

Do not change these behaviors unless explicitly instructed.

---

## Product Grid Behavior

Product cards must contain

Product image  
Product title  
Price  
Stock message  
Primary action button  

Do not include a "Learn More" button in the product grid.

The product grid must remain visually compact to support high product density on mobile.

---

## Product Availability

Availability must be determined using WooCommerce stock_status.

instock

→ Show Add to Cart

outofstock

→ Show text "Currently out of stock"  
→ Show Special Order button

onbackorder

→ Treat as Special Order

---

## Special Order Workflow

Special orders allow customers to purchase items that are not currently in showroom stock.

When a customer clicks Special Order

Show the confirmation modal.

The modal must display

Delivery lead time  
Special order delivery charge  
Order policy warning

---

## Special Order Delivery Time

All special orders must display

Delivery 10–12 days

This must appear

On the product card  
Inside the special order modal

---

## Special Order Policy

Customers must accept the order policy before adding the item to cart.

Policy summary

Special orders cannot be cancelled or refunded once confirmed.

This policy must appear in the special order confirmation modal.

---

## Pricing Rules

Prices must always be formatted as

60.00 KWD

Never

KWD 60.00

Currency must appear after the amount.

---

## Special Order Delivery Fee

Special order delivery fees are calculated dynamically.

The calculation uses

Product weight  
Product dimensions

These values are retrieved from WooCommerce.

The delivery fee must only appear in the Special Order modal.

It must not appear on product cards.

---

## Image Presentation

Product images must always scale uniformly.

Use

object-fit: contain

Images must never be cropped.

All product cards must display images consistently.

---

## Hero Carousel Behavior

The homepage hero banner must support

Swipe gestures on mobile  
Dot navigation  
Automatic sliding

Users must be able to swipe left or right to change slides.

---

## Mobile Optimization

The site must prioritize mobile usability.

Requirements

Reduce excessive scrolling  
Increase product density in grids  
Ensure buttons remain readable  
Ensure cards remain visually consistent

---

## Category Navigation

Product categories must appear before the featured products section.

Categories should be represented with icons.

Main categories

Printers  
Accessories  
Scanners

These categories must support drill-down navigation.

Example

Printers → FDM / Resin

---

## UX Consistency

All product cards must use the same design across the entire website.

Do not create alternate card styles.

Always reuse the shared ProductCard component.

---

## Checkout Behavior

Add to Cart

Adds the item to the WooCommerce cart.

Special Order

Requires confirmation through the modal before adding to cart.

---

## Administrative Backend

WordPress + WooCommerce remains the primary backend system.

Administrators manage

Products  
Inventory  
Orders  
Shipping data

The frontend must always respect backend data.

Never override WooCommerce stock or pricing logic in the frontend.

---

# Frontend Feature Map

This section maps major features to their source files.

Agents must consult this map before implementing new functionality.

Do not create duplicate components if a feature already exists.

Always extend existing implementations when possible.

---

## Homepage

File

app/page.tsx

Responsible for

Homepage layout  
Hero carousel  
Category icons  
New arrivals section  
Featured products grid  

---

## Hero Carousel

File

components/CampaignHero.tsx

Responsible for

Homepage banner slider  
Campaign flyer display  
Mobile swipe gestures  
Hero navigation dots  

Rules

Must support swipe left/right on mobile.  
Must maintain consistent banner aspect ratio.  
Images must fully fit within container without distortion.

---

## Product Card

File

components/ProductCard.tsx

Responsible for

Rendering product cards across the entire site.

Used by

Homepage featured products  
Category pages  
Search results  
Related products  

Rules

All product grids must use this component.

Never create alternative card implementations.

---

## Product Grid Layout

File

components/ProductGrid.tsx

Responsible for

Grid structure and layout.

Grid column rules

mobile → 2 columns  
tablet → 3 columns  
desktop → 4 columns  

Spacing must remain consistent across the site.

---

## Product Availability Logic

File

lib/productLogic.ts

Responsible for

Mapping WooCommerce stock data to UI behavior.

Rules

stock_status = instock

→ Available  
→ Show Add to Cart

stock_status = outofstock

→ Special Order

stock_status = onbackorder

→ Special Order

Never rely solely on is_in_stock.

---

## Special Order Modal

File

components/OrderWarningModal.tsx

Responsible for

Displaying special order confirmation.

Shows

Delivery lead time  
Special order delivery fee  
Order policy notice  

Users must confirm before adding item to cart.

---

## Special Order Pricing

File

lib/specialOrderPricing.ts

Responsible for

Calculating delivery fee for special orders.

Uses

Product weight  
Product dimensions

Formula

(weight * 0.75) + ((length * width * height) / 5000 * 0.5)

Fee is shown only in the modal.

Never show delivery fee on product cards.

---

## WooCommerce API Integration

File

lib/woocommerce.ts

Responsible for

Fetching product data from WooCommerce.

Primary API

/wp-json/wc/store/v1/products

---

## Shipping Data API Proxy

File

app/api/product-shipping/[id]/route.ts

Responsible for

Fetching shipping data from WooCommerce REST API.

Uses

/wp-json/wc/v3/products/{id}

Returns

weight  
dimensions  

Frontend uses this to calculate special order delivery fees.

---

## Product Detail Page

File

app/product/[slug]/page.tsx

Responsible for

Full product page layout.

Displays

Product gallery  
Product specs  
Pricing  
Availability  
Add to cart / Special order  
Related products  

---

## Cart Page

File

app/cart/page.tsx

Responsible for

Cart UI and order summary.

Uses WooCommerce Store API cart endpoints.

---

## Checkout

File

app/checkout/page.tsx

Responsible for

Checkout form  
Customer details  
Payment integration  

Uses WooCommerce checkout API.

---

## Account Dashboard

File

app/account/page.tsx

Responsible for

User account area.

Includes

Orders history  
Recurring orders  
Loyalty points  
Profile management  

---

## Printing Service

File

app/printing-service/page.tsx

Responsible for

3D printing service UI.

Features

File upload  
Model analysis  
Material estimate  
Print time estimate  
Cost estimate  

Uses 3D slicer integration.

---

## Search

File

app/search/page.tsx

Responsible for

Product search results.

Uses

WooCommerce Store API search.

---

## Categories

File

app/category/[slug]/page.tsx

Responsible for

Category browsing.

Displays product grid filtered by category.

---

## Global Styles

File

app/globals.css

Responsible for

Global UI styling  
Grid consistency  
Image scaling  
Responsive layout  

---

# Common Development Commands

Agents must use the following commands when working on this project.

These commands ensure the project remains stable during development.

---

## Install Dependencies

npm install

---

## Run Development Server

npm run dev

This starts the Next.js development server.

Default local URL

http://localhost:3000

---

## TypeScript Check

Before finalizing any code change run

npx tsc --noEmit

This ensures there are no TypeScript errors.

Agents must not introduce TypeScript errors.

---

## Production Build Test

If major changes are made, verify the project builds successfully.

npm run build

This confirms the project compiles correctly.

---

## Restart Server After Environment Changes

If `.env.local` is modified, the development server must be restarted.

Stop the server and run

npm run dev

Environment variables do not reload automatically.

---

## API Debugging

When debugging WooCommerce data, use browser inspection or console logs.

Example

console.log("Woo product", product)

Always confirm API response fields before implementing logic.

---

## Git Best Practices

Agents should avoid making large unrelated changes.

Prefer small targeted fixes.

Do not refactor large parts of the codebase unless explicitly instructed.

---

## Important Development Rule

If a change affects business logic (pricing, availability, special orders),

always verify the WooCommerce API response before modifying frontend logic.

Never assume backend data structure.

# Learned Rules

<!-- New rules are appended below this line. Do not edit above this section. -->
1. [CODE] Never call filtered WooCommerce product getter methods from inside the corresponding getter filters — because it can recurse and break Store API cart requests.

---

# Karpathy Skills — Agent Coding Principles

Behavioral guidelines to reduce common LLM coding mistakes. These apply to all agents working in this codebase.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

---

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

---

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

These guidelines are working if: fewer unnecessary changes appear in diffs, fewer rewrites occur due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

