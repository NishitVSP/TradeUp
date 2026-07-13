# TradeUp - Options Trading Platform

**Creator**: Nishit Prajapati  


A comprehensive options trading platform built with React, Node.js, and SQLite, featuring real-time price tracking, limit order management, and advanced position risk controls.

## 🚀 Features

- **Real-time Options Trading**: Live price updates for NIFTY, BANKNIFTY, and other indices
- **Advanced Order Management**: Market orders, limit orders with automatic execution
- **Position Risk Controls**: Target, stop-loss, trailing, and MTM-based position management
- **Trade History**: Complete order book and trade book with filtering
- **User Authentication**: Secure login system with balance management
- **Responsive UI**: Modern interface built with Material-UI and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Next.js 16** for SSR and routing
- **Material-UI (MUI)** for components
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQLite** for database
- **JWT** for authentication
- **Real-time updates** with polling

## 📋 Prerequisites

- Node.js 18+ 
- Yarn package manager
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/TradeUp.git
cd TradeUp
```

### 2. Install Dependencies
```bash

# Install frontend dependencies
cd frontend
yarn

# Install backend dependencies  
cd ../backend
yarn
```

### 3. Setup Database
```bash
# Navigate to backend directory
cd backend

# Run the options contracts population script
npx ts-node src/scripts/populateOptionsContracts.ts

# This will:
# - Create SQLite database with required tables
# - Fetch current spot prices for all indices
# - Generate options contracts with strikes around ATM
# - Populate expiry dates
# - Setup initial data structure
```

### 4. Start the Application

#### Backend Server
```bash
# In backend directory
yarn start
```
The backend will start on `http://localhost:3001`

#### Frontend Development Server
```bash
# In frontend directory (new terminal)
yarn dev
```
The frontend will start on `http://localhost:3000`

## 📁 Project Structure

```
TradeUp/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/      # Reusable React components
│   │   ├── store/          # Redux store and slices
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── scripts/        # Database setup scripts
│   │   └── utils/         # Backend utilities
│   └── package.json
├── README.md
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in both frontend and backend directories:

#### Backend (.env)
```
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=./database/tradeup.db
PORT=3001
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 Database Setup

The application uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **orders**: Order history and status tracking
- **positions**: Active trading positions
- **options_contract**: Available options contracts

The `populateOptionsContracts.ts` script handles:
- Fetching real-time spot prices
- Calculating ATM (At-The-Money) strikes
- Generating strike ranges (±40 strikes from ATM)
- Setting up expiry dates
- Creating initial contract data

## 🎯 Key Features Usage

### Limit Orders
1. Set a limit price in the OrderPanel
2. Order remains PENDING until market price crosses limit
3. Automatic execution when conditions are met
4. Real-time monitoring with visual indicators

### Position Risk Management
1. **Individual Position Controls**:
   - Target: Close when profit target reached
   - Stop Loss: Close when loss limit reached
   - Trail: Trailing stop-loss based on highest P&L
   - MTM Trail: Trail based on total P&L

2. **Global MTM Protection**:
   - Set overall portfolio target/stop-loss
   - Automatic closure of all positions when limits hit
   - Real-time P&L tracking and warnings

### Order Types
- **Market Orders**: Execute immediately at current market price
- **Limit Orders**: Execute only when specified price is reached
- **Stop Loss**: Automatic position closure at predefined loss levels

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Orders
- `POST /api/orders` - Place new order
- `POST /api/orders/close-position` - Close position
- `GET /api/orders/history` - Get order history

### Market Data
- `GET /api/market/spot-prices` - Current spot prices
- `GET /api/market/options-contracts` - Available contracts
- `GET /api/market/ltp/:symbol/:strike/:expiry` - Live LTP data

## 🐛 Troubleshooting

### Common Issues

1. **Hydration Errors**: Fixed with client-side checks in components
2. **Database Connection**: Ensure SQLite file permissions are correct
3. **Port Conflicts**: Change backend PORT in .env if 3001 is occupied
4. **CORS Issues**: Verify frontend API_URL matches backend URL

### Development Tips

- Use `yarn dev` for frontend development with hot reload
- Backend changes require restart with `yarn start`
- Database changes may require re-running the populate script
- Check browser console for real-time API errors

## 📝 Development Workflow

1. Make changes to frontend/backend code
2. Test features in development environment
3. Update database schema if needed (modify populate script)
4. Commit changes with descriptive messages
5. Test full workflow before deployment

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
yarn build

# Backend (typically with PM2 or similar)
cd backend
yarn start
```

### Environment Setup
- Set production environment variables
- Configure production database
- Update API endpoints for production URLs
- Set up SSL certificates for HTTPS

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify backend logs for API issues
4. Ensure all environment variables are set correctly

---

**Developed by Group 29 - Nishit Prajapati (202351106)**  
