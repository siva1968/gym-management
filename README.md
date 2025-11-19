# Elite Arena Gym - Management System

A comprehensive gym management system built with PostgreSQL, Express.js, React, and Node.js for managing all aspects of a fitness center.

## Features

### Admin Panel
- **Dashboard**: Real-time overview of members, revenue, attendance, and key metrics
- **Member Management**: Complete CRUD operations for gym members
  - Add/Edit/Delete members
  - QR code generation for attendance tracking
  - Membership type and plan management
  - Payment status tracking
  - Renewal reminders
- **Trainer Management**: Manage trainers and staff
  - Add/Edit/Delete trainers
  - Track specializations and certifications
  - Assign members to trainers
  - Salary and commission tracking
- **Attendance System**: Track member attendance
  - QR code scanning (manual entry also supported)
  - Daily attendance reports
  - Member attendance history
  - Attendance analytics
- **Fee Management**:
  - Membership plan creation and management
  - Payment recording and invoice generation
  - Revenue tracking by payment method
  - Pending dues alerts
- **Expense Management**:
  - Track all gym expenses by category
  - Monthly expense reports
  - Expense breakdown by category
- **Reports & Analytics**:
  - Income and expense reports
  - Profit/Loss statements
  - Member retention analytics
  - Membership statistics
  - Daily, weekly, monthly reports

## Recent Improvements & Enhancements

### Critical Bug Fixes
- Fixed deprecated Mongoose connection options
- Fixed MemberDetail page data fetching bug (memberId undefined)
- Fixed member creation to auto-calculate end date from membership plan
- Fixed membership renewal with proper plan price calculation

### New Features
- **Sample Data Seeder**: Quickly populate database with realistic test data
- **Input Validation**: Comprehensive server-side validation using express-validator
- **Enhanced Member Detail Page**: Now shows payment history and attendance records
- **Dashboard Charts**: Visual analytics with pie charts for membership distribution
- **Request Logging**: Development mode logging for easier debugging
- **Automated End Date Calculation**: Smart date calculation based on membership plan duration

### Scripts Added
- `npm run setup`: One-command setup (creates admin + seeds database)
- `npm run seed`: Populate database with sample data
- `npm run create-admin`: Create default admin user

## Tech Stack

### Backend
- **Node.js** & **Express.js**: Server and API
- **PostgreSQL** with **Sequelize**: Database (ORM)
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **QRCode**: QR code generation
- **Moment.js**: Date handling
- **express-validator**: Input validation

### Frontend
- **React**: UI library (v18)
- **React Router**: Navigation (v6)
- **Axios**: API calls
- **React Toastify**: Notifications
- **React Icons**: Icons
- **Recharts**: Charts and analytics (Pie charts, Bar charts)

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd gym-management
```

2. Install backend dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your PostgreSQL database configurations:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elite_arena_gym
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@elitearena.com
ADMIN_PASSWORD=Admin@123
```

5. Create PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE elite_arena_gym;
\q
```

6. Create uploads directory:
```bash
mkdir uploads
```

7. Sync database (creates all tables):
```bash
node backend/scripts/syncDatabase.js
```

8. Quick setup (creates admin + seeds database with sample data):
```bash
npm run setup
```

OR manually:
```bash
# Create admin user
npm run create-admin

# Seed database with sample data (optional)
npm run seed
```

9. Start the backend server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Running Both Servers Concurrently

From the root directory:
```bash
npm run dev:full
```

## Default Credentials

After running the admin creation script:
- **Email**: admin@elitearena.com
- **Password**: Admin@123

**Important**: Change the default password after first login!

## Quick Start with Sample Data

To get started quickly with pre-populated sample data:

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Setup everything (admin + sample data)
npm run setup

# Run both backend and frontend
npm run dev:full
```

The sample data includes:
- 4 Membership plans
- 3 Trainers
- 10 Members (with varying payment statuses)
- 30 days of attendance records
- Payment history
- 3 months of expense records

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `GET /api/members/dues/pending` - Get members with pending dues
- `GET /api/members/expiring/soon` - Get expiring memberships
- `POST /api/members/:id/renew` - Renew membership

### Trainers
- `GET /api/trainers` - Get all trainers
- `GET /api/trainers/:id` - Get trainer by ID
- `POST /api/trainers` - Create new trainer
- `PUT /api/trainers/:id` - Update trainer
- `DELETE /api/trainers/:id` - Delete trainer
- `POST /api/trainers/:trainerId/assign/:memberId` - Assign member
- `DELETE /api/trainers/:trainerId/remove/:memberId` - Remove member

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/today` - Get today's attendance
- `POST /api/attendance/checkin` - Check-in member
- `POST /api/attendance/checkout/:id` - Check-out member
- `GET /api/attendance/member/:memberId` - Get member history

### Fees & Payments
- `GET /api/fees/plans` - Get membership plans
- `POST /api/fees/plans` - Create plan
- `GET /api/fees/payments` - Get all payments
- `POST /api/fees/payments` - Record payment
- `GET /api/fees/revenue/summary` - Get revenue summary

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary/stats` - Get expense summary

### Reports
- `GET /api/reports/income` - Get income report
- `GET /api/reports/attendance` - Get attendance report
- `GET /api/reports/retention` - Get retention report
- `GET /api/reports/profit-loss` - Get profit/loss report
- `GET /api/reports/membership-stats` - Get membership statistics

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activities` - Get recent activities

## Database Models

### User
- Admin/Staff authentication
- Role-based access control

### Member
- Personal information
- Membership details
- Payment tracking
- QR code for attendance
- Health and fitness information

### Trainer
- Personal and professional details
- Specializations and certifications
- Assigned members
- Salary information

### Attendance
- Check-in/check-out tracking
- Duration calculation
- Multiple check-in methods support

### Payment
- Payment recording
- Invoice generation
- Payment method tracking

### Expense
- Category-based tracking
- Receipt management
- Recurring expense support

### MembershipPlan
- Plan details and pricing
- Duration and features
- Discount management

## Project Structure

```
gym-management/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth & validation middleware
│   ├── scripts/         # Utility scripts (sync, seed, createAdmin)
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Context API
│       ├── pages/       # Page components
│       ├── services/    # API services
│       └── App.js       # Main app
├── uploads/             # File uploads
├── .env.example         # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Future Enhancements

- Member mobile app for attendance and progress tracking
- WhatsApp/SMS integration for automated reminders
- Body progress tracking with photos and measurements
- Diet and workout plan management
- Lead management system
- Multi-branch support
- Payment gateway integration
- Email notifications
- Advanced analytics and insights

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - feel free to use this project for your gym!

## Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for Elite Arena Gym**
