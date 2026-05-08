# Product Requirements Document
## Gold Selling Multi-Shop Application

---

## 1. Overview

### 1.1 Product Vision
A Next.js-based e-commerce platform for selling gold products across multiple shops, featuring role-based access control, multi-language support, and multi-currency capabilities.

### 1.2 Target Users
- **Super Admins**: Platform owners managing all shops
- **Shop Admins**: Individual shop managers
- **Clients**: End customers purchasing gold products

---

## 2. User Roles & Permissions

### 2.1 Super Admin
**Full Platform Control**
- Manage all shops (create, edit, delete, suspend)
- View consolidated analytics across all shops
- Manage shop admins (assign, remove, permissions)
- Configure global platform settings
- Access all financial reports
- Manage currencies and exchange rates
- Configure payment gateways
- View all orders across shops
- Manage commission structure

### 2.2 Shop Admin
**Individual Shop Management**
- Dashboard with shop-specific analytics
- Product management (add, edit, delete products)
- Inventory management
- Order management (view, update status, process)
- Customer management (view customer data, order history)
- Shop profile settings (logo, description, contact)
- Staff management (if applicable)
- Financial reports for own shop
- Manage shop-specific promotions/discounts

### 2.3 Client
**Customer Features**
- Browse products across all shops or by specific shop
- Product search and filtering (by price, weight, karat, type)
- Product details with images and specifications
- Shopping cart functionality
- Wishlist
- Checkout with multiple payment options
- Order tracking
- Order history
- Profile management
- Address book
- Customer support/chat

---

## 3. Core Features

### 3.1 Product Management

#### Product Attributes
- Product name
- Category (rings, necklaces, bracelets, earrings, bars, coins)
- Gold karat (24K, 22K, 21K, 18K, 14K)
- Weight (grams)
- Making charges
- Base price per gram (live gold rate)
- Final price calculation
- Product images (multiple)
- Description
- Stock quantity
- SKU
- Shop association

#### Product Features
- Live gold rate integration
- Dynamic pricing based on:
  - Current gold rate
  - Weight
  - Karat
  - Making charges
  - Currency conversion
- Bulk upload capability
- Product variants (size, design modifications)

### 3.2 Shop Management

#### Shop Profile
- Shop name
- Logo and banner images
- Description
- Location/address
- Contact information
- Business hours
- Registration documents
- Bank details for payments
- Commission rate (set by super admin)

#### Shop Features
- Individual shop pages
- Shop-specific branding
- Performance analytics
- Inventory alerts
- Sales reports

### 3.3 Multi-Language Support

#### Supported Languages
- Arabic (AR) - RTL support
- English (EN) - Default
- Extensible for additional languages

#### Localization Features
- Complete UI translation
- Language switcher in header
- Persistent language preference
- Localized currency formats
- Localized date/time formats
- Translated product descriptions
- Translated email notifications

### 3.4 Multi-Currency Support

#### Supported Currencies
- US Dollar (USD)
- Kuwaiti Dinar (KWD)
- UAE Dirham (AED)
- Extensible for additional currencies

#### Currency Features
- Real-time exchange rate API integration
- Currency switcher in header
- Automatic price conversion
- Currency symbol and format localization
- Default currency per user location
- Transaction currency recording
- Exchange rate history for reporting

### 3.5 Order Management

#### Order Flow
1. Cart → Checkout
2. Address selection/entry
3. Payment method selection
4. Order confirmation
5. Payment processing
6. Order fulfillment
7. Delivery/pickup
8. Order completion

#### Order Statuses
- Pending Payment
- Payment Confirmed
- Processing
- Ready for Pickup/Shipped
- Out for Delivery
- Delivered
- Completed
- Cancelled
- Refunded

#### Order Features
- Order tracking with timeline
- Email/SMS notifications
- Invoice generation
- Packing slip
- Return/refund management
- Order notes and communication

### 3.6 Payment Integration

#### Payment Methods
- Credit/Debit cards
- Digital wallets (Apple Pay, Google Pay)
- Bank transfer
- Cash on delivery (if applicable)
- Installment plans (if applicable)

#### Payment Features
- Secure payment gateway integration
- PCI compliance
- Split payments (platform commission + shop payout)
- Refund processing
- Payment history

### 3.7 Gold Rate Integration

#### Features
- Live gold rate API integration
- Rates by karat (24K, 22K, 21K, 18K, 14K)
- Historical rate tracking
- Manual rate override (admin)
- Rate update frequency configuration
- Display current rate on homepage

---

## 4. Technical Requirements

### 4.1 Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **State Management**: Zustand/Redux Toolkit
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl
- **Payments**: Stripe/PayPal
- **File Storage**: AWS S3 / Cloudinary
- **Email**: SendGrid / Resend
- **Deployment**: Vercel

### 4.2 Database Schema (Key Entities)

```
Users
- id, email, password, role, language_preference, currency_preference

Shops
- id, name, admin_id, logo, description, commission_rate, status

Products
- id, shop_id, name, category, karat, weight, making_charges, images, stock

Orders
- id, user_id, shop_id, total, currency, exchange_rate, status

OrderItems
- id, order_id, product_id, quantity, price_at_purchase

GoldRates
- id, karat, rate, currency, timestamp

Currencies
- id, code, symbol, exchange_rate_to_base

Translations
- id, key, language, value
```

### 4.3 API Endpoints

#### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

#### Products
- GET /api/products (with filters)
- GET /api/products/:id
- POST /api/products (admin)
- PUT /api/products/:id (admin)
- DELETE /api/products/:id (admin)

#### Shops
- GET /api/shops
- GET /api/shops/:id
- POST /api/shops (super admin)
- PUT /api/shops/:id (super admin/shop admin)

#### Orders
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders/create
- PUT /api/orders/:id/status

#### Gold Rates
- GET /api/gold-rates
- POST /api/gold-rates/update (admin)

#### Settings
- GET /api/currencies
- GET /api/translations/:language

---

## 5. UI/UX Requirements

### 5.1 Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop experience

### 5.2 Key Pages

#### Public Pages
- Homepage (featured products, live gold rate, shop directory)
- Shop listing page
- Shop detail page
- Product listing page (with filters)
- Product detail page
- About/Contact pages

#### Authenticated Pages
- Dashboard (role-specific)
- Profile settings
- Order history
- Cart
- Checkout
- Wishlist

#### Admin Pages
- Analytics dashboard
- Product management
- Order management
- Shop management (super admin)
- Settings

### 5.3 Design Principles
- Clean, professional aesthetic
- Trust indicators (security badges, certifications)
- High-quality product imagery
- Clear call-to-actions
- Accessible (WCAG 2.1 AA)
- RTL support for Arabic

---

## 6. Security Requirements

- SSL/TLS encryption
- Secure authentication (bcrypt password hashing)
- JWT token management
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Secure file upload
- PCI DSS compliance for payments

---

## 7. Performance Requirements

- Page load time: < 2 seconds
- Time to Interactive: < 3 seconds
- Lighthouse score: > 90
- Image optimization (WebP, lazy loading)
- Code splitting
- Caching strategy (ISR, API caching)
- CDN for static assets

---

## 8. Analytics & Reporting

### 8.1 Super Admin Analytics
- Total sales across all shops
- Revenue by shop
- Commission earned
- Active shops
- Total orders
- Customer growth
- Popular products

### 8.2 Shop Admin Analytics
- Shop revenue
- Order count
- Best-selling products
- Inventory levels
- Customer demographics
- Average order value
- Conversion rate

---

## 9. Future Enhancements (Phase 2)

- Mobile app (React Native)
- Customer loyalty program
- Referral system
- Live chat support
- AR product visualization
- Subscription model for regular purchases
- Auction feature for rare pieces
- Social media integration
- Review and rating system
- Advanced analytics with ML predictions

---

## 10. Success Metrics

- User registration rate
- Conversion rate (visitor to customer)
- Average order value
- Customer retention rate
- Shop admin satisfaction
- Platform uptime (99.9%+)
- Customer support response time

---

## 11. Timeline Estimate

**Phase 1 (MVP)**: 12-16 weeks
- Week 1-2: Setup, architecture, database design
- Week 3-5: Authentication, user management, role system
- Week 6-8: Product management, shop management
- Week 9-11: Shopping cart, checkout, payment integration
- Week 12-14: Admin dashboards, analytics
- Week 15-16: Testing, bug fixes, deployment

**Phase 2 (Enhancements)**: 8-12 weeks

---

## 12. Dependencies & Integrations

### Required Third-party Services
- Gold rate API (e.g., Metals.dev, GoldAPI)
- Payment gateway (Stripe, PayPal, or regional)
- Exchange rate API (ExchangeRate-API, Fixer.io)
- Email service (SendGrid, AWS SES)
- SMS service (Twilio) - optional
- Cloud storage (AWS S3, Cloudinary)
- Analytics (Google Analytics, Mixpanel)

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Status**: Draft