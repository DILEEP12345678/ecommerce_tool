# Bulk Orders Import Guide

## Overview
The Bulk Orders feature allows administrators to import multiple orders from a CSV file. Orders are automatically assigned to users based on their email addresses.

## How It Works

1. **Admin uploads a CSV file** with order details
2. **System processes each row**:
   - Finds the user by email
   - Looks up products by name
   - Validates stock availability
   - Creates orders with all items
   - Updates product inventory
3. **Orders appear in each user's Orders page** based on their email

## CSV Format

### Required Columns
- `email` - User's email address (must exist in system)
- `product_name` - Exact product name from your product catalog
- `quantity` - Number of items to order
- `street` - Delivery street address
- `city` - City name
- `state` - State/Province name
- `zipcode` - Postal/ZIP code

### Optional Columns
- `payment_method` - Payment method (default: "Cash on Delivery")
- `status` - Order status: pending, confirmed, preparing, out_for_delivery, delivered, cancelled (default: "pending")
- `notes` - Additional notes for the order

### Example CSV

```csv
email,product_name,quantity,street,city,state,zipcode,payment_method,status,notes
user@example.com,Fresh Bananas,2,123 Main St,Mumbai,Maharashtra,400001,Cash on Delivery,pending,Deliver in morning
user@example.com,Organic Tomatoes,1,123 Main St,Mumbai,Maharashtra,400001,Cash on Delivery,pending,Deliver in morning
customer@test.com,Fresh Milk,3,456 Park Ave,Delhi,Delhi,110001,Online Payment,confirmed,Handle with care
```

## Important Notes

### Multiple Items per Order
- **Same email on different rows = Different orders**
- If you want multiple items in ONE order, you need to modify the CSV format or create separate orders

### User Requirements
- Users MUST exist in the system before importing
- Use the "Create Test Users" button to create sample users for testing
- Test users created:
  - user@example.com
  - customer@test.com
  - john@email.com

### Product Names
- Product names must match EXACTLY (case-sensitive)
- Use the exact names from your Products page
- Examples from seed data:
  - Fresh Bananas
  - Organic Tomatoes
  - Fresh Spinach
  - Fresh Milk
  - Farm Eggs
  - Greek Yogurt
  - Whole Wheat Bread
  - Croissants
  - Orange Juice
  - Green Tea
  - Mixed Nuts
  - Potato Chips

### Stock Management
- Orders will only be created if sufficient stock is available
- Stock is automatically reduced when orders are created
- If stock is insufficient, that order will fail with an error message

## Step-by-Step Guide

### 1. Prepare Your Data
- Create a CSV file with the required columns
- Make sure all user emails exist in the system
- Verify product names match exactly

### 2. Create Test Users (For Testing)
- Navigate to Admin > Bulk Orders
- Click "Create Test Users" button
- This creates 3 test users you can use in your CSV

### 3. Download Template
- Click "Download Template CSV" to get a pre-formatted template
- Edit the template with your actual data

### 4. Upload CSV
- Click "Select CSV File" and choose your file
- Review the file name to confirm it's correct
- Click "Import Orders"

### 5. Review Results
- Success count shows orders created successfully
- Failed count shows orders that couldn't be created
- Detailed error messages explain what went wrong
- Common errors:
  - User not found (email doesn't exist)
  - Product not found (wrong product name)
  - Insufficient stock

### 6. Verify Orders
- Check Admin > Orders to see all orders
- Users can see their orders in Store > Orders
- Orders are filtered by user email automatically

## Troubleshooting

### "User not found" Error
- Make sure the user exists in the system
- Check email spelling and case
- Use "Create Test Users" for testing

### "Product not found" Error
- Verify product name spelling (case-sensitive)
- Check Products page for exact names
- Make sure products are seeded/created

### "Insufficient stock" Error
- Check product stock levels in Products page
- Reduce order quantity
- Restock products before importing

### No Orders Showing
- Verify CSV has valid data rows (not just headers)
- Check for parsing errors in the error messages
- Ensure at least one row has all required fields

## Testing the Feature

1. **Seed the database**: Click "Seed Database" on admin dashboard
2. **Create test users**: Click "Create Test Users" on Bulk Orders page
3. **Use sample CSV**: There's a `sample_orders.csv` in the project root
4. **Upload and verify**: Upload the sample CSV and check orders appear
5. **Check user view**: Log in as test users to see their orders

## Sample CSV Location
A sample CSV file is provided at: `sample_orders.csv`

This file includes sample orders for the test users and uses products from the seed data.
