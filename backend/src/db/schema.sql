-- Users table
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    phone_number TEXT,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Options contracts
CREATE TABLE options_contract (
    contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
    index_name TEXT NOT NULL, 
    strike_price REAL NOT NULL,
    expiry_date DATE NOT NULL,
    option_type TEXT CHECK(option_type IN ('CE', 'PE')) NOT NULL,
    ltp REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(index_name, strike_price, expiry_date, option_type)
);

-- Orders
CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    contract_id INTEGER,
    order_type TEXT CHECK(order_type IN ('LMT', 'MKT', 'SL')) NOT NULL,
    action TEXT CHECK(action IN ('BUY', 'SELL')) NOT NULL,
    quantity INTEGER NOT NULL,
    limit_price REAL,
    status TEXT CHECK(status IN ('PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED')) DEFAULT 'PENDING',
    placed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    executed_at DATETIME,
    execution_price REAL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (contract_id) REFERENCES options_contract(contract_id)
);

-- Positions
CREATE TABLE positions (
    position_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    contract_id INTEGER,
    quantity INTEGER NOT NULL,
    unrealized_pnl REAL DEFAULT 0,
    realized_pnl REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (contract_id) REFERENCES options_contract(contract_id),
    UNIQUE(user_id, contract_id)
);