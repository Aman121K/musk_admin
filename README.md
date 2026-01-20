# Musk Admin Panel

Separate admin panel for managing Musk Perfumery website content.

## Structure

The admin panel is completely separate from the main website:
- **Website**: Runs on port 3000
- **Admin Panel**: Runs on port 3001
- **Backend API**: Runs on port 5000

## Features

- Product Management (CRUD)
- Blog Management (CRUD)
- Testimonial Management (CRUD)
- Image Upload
- Order Management
- Dashboard with Statistics

## Setup

1. Navigate to admin directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

## Login

Default admin credentials should be created in the database. Contact the system administrator for access.

## Pages

- `/` - Login page
- `/dashboard` - Main dashboard with statistics
- `/products` - Product listing and management
- `/products/new` - Create new product
- `/products/[id]` - Edit product
- `/blogs` - Blog management
- `/blogs/new` - Create new blog post
- `/testimonials` - Testimonial management
- `/testimonials/new` - Add new testimonial
- `/orders` - Order management

## API Endpoints

All admin operations use the same backend API at `http://localhost:5000`:
- `/api/products` - Product CRUD
- `/api/blogs` - Blog CRUD
- `/api/testimonials` - Testimonial CRUD
- `/api/upload` - Image upload
- `/api/orders` - Order management

