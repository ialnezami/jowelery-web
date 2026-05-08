# Setup Guide

## Quick Start

### 1. Start Docker Services

```bash
# Start MongoDB
docker-compose -f docker-compose.dev.yml up -d

# Or start everything (if using full docker-compose.yml)
docker-compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file:

```env
DATABASE_URL="mongodb://admin:password@localhost:27017/jowelery?authSource=admin"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production-min-32-chars"
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Test Credentials

After seeding:

- **Super Admin**: admin@jowelery.com / admin123
- **Shop Admin 1**: shop1@jowelery.com / shop123
- **Shop Admin 2**: shop2@jowelery.com / shop123
- **Client**: client@jowelery.com / client123

## Testing Checklist

### Mobile Testing (Primary Focus)

1. **Homepage** (`/`)
   - [ ] Hero section displays correctly
   - [ ] Gold rates section is readable
   - [ ] Featured products grid is responsive
   - [ ] Navigation works on mobile

2. **Products Page** (`/products`)
   - [ ] Filters sidebar is accessible on mobile
   - [ ] Product cards stack properly
   - [ ] Images load correctly
   - [ ] Filter button works on mobile

3. **Product Detail** (`/products/[id]`)
   - [ ] Product images are visible
   - [ ] Details are readable
   - [ ] Add to cart button works
   - [ ] Quantity selector is usable

4. **Auth Pages**
   - [ ] Login page (`/auth/login`) - mobile friendly
   - [ ] Register page (`/auth/register`) - mobile friendly
   - [ ] Forgot password (`/auth/forgot-password`) - mobile friendly
   - [ ] Reset password (`/auth/reset-password`) - mobile friendly

5. **Cart** (`/cart`)
   - [ ] Cart items display correctly
   - [ ] Order summary is sticky/accessible
   - [ ] Remove button works
   - [ ] Checkout button works

6. **Checkout** (`/checkout`)
   - [ ] Form fields are accessible
   - [ ] Address form is mobile-friendly
   - [ ] Order summary is visible
   - [ ] Submit works

7. **Dashboard** (`/dashboard`)
   - [ ] Role-specific content displays
   - [ ] Cards are responsive
   - [ ] Navigation works

8. **Orders** (`/dashboard/orders`)
   - [ ] Order list displays correctly
   - [ ] Order details are readable
   - [ ] Status badges are visible

## Mobile-First Design Features

All pages are optimized for mobile with:

- ✅ Responsive grid layouts
- ✅ Touch-friendly buttons (min 44x44px)
- ✅ Readable typography (16px base)
- ✅ Proper spacing and padding
- ✅ Mobile navigation menu
- ✅ Optimized images
- ✅ Accessible forms
- ✅ Smooth animations

## Browser Testing

Test in:
- Chrome Mobile (DevTools)
- Safari Mobile
- Firefox Mobile
- Chrome Desktop (responsive mode)

## Common Issues

### MongoDB Connection Error
```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose -f docker-compose.dev.yml restart mongodb
```

### Prisma Client Not Generated
```bash
npm run db:generate
```

### Database Not Seeded
```bash
npm run db:seed
```

