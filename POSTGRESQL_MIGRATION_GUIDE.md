# PostgreSQL Migration Guide

## Overview
This guide explains how to migrate the Elite Arena Gym Management System from MongoDB to PostgreSQL.

## Why PostgreSQL?
- **ACID Compliance**: Better data integrity and consistency
- **Complex Queries**: Advanced SQL capabilities
- **Relational Data**: Better handling of relationships between entities
- **Performance**: Better performance for complex joins and aggregations
- **Mature Ecosystem**: Extensive tools and community support

## Prerequisites
- PostgreSQL 12 or higher installed
- Node.js 14 or higher
- All existing MongoDB data backed up (if migrating existing data)

## Installation Steps

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE elite_arena_gym;

# Create user
CREATE USER gym_admin WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE elite_arena_gym TO gym_admin;

# Exit
\q
```

### 3. Update Environment Variables

Update your `.env` file:
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elite_arena_gym
DB_USER=gym_admin
DB_PASSWORD=your_secure_password

# Keep other variables the same
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@elitearena.com
ADMIN_PASSWORD=Admin@123
```

### 4. Install Dependencies

```bash
# Remove MongoDB packages
npm uninstall mongoose

# Install PostgreSQL packages
npm install sequelize pg pg-hstore

# Or use the updated package.json
npm install
```

### 5. Run Migrations

```bash
# This will create all tables
npm run migrate

# Create admin user
npm run create-admin

# Seed with sample data (optional)
npm run seed
```

## Key Changes from MongoDB to PostgreSQL

### Model Changes
| MongoDB (Mongoose) | PostgreSQL (Sequelize) |
|-------------------|------------------------|
| `_id` (ObjectId) | `id` (UUID) |
| `Schema` | `sequelize.define()` |
| Embedded documents | JSONB fields |
| References | Foreign Keys |
| `populate()` | `include` (joins) |

### Query Changes
| MongoDB | PostgreSQL (Sequelize) |
|---------|----------------------|
| `Model.find()` | `Model.findAll()` |
| `Model.findOne()` | `Model.findOne()` |
| `Model.findById()` | `Model.findByPk()` |
| `Model.create()` | `Model.create()` |
| `Model.findByIdAndUpdate()` | `Model.update()` then `findByPk()` |
| `Model.findByIdAndDelete()` | `Model.destroy()` |
| `$regex` | `Op.like` or `Op.iLike` |
| `$or` | `Op.or` |
| `$and` | `Op.and` |
| `$gt, $lt` | `Op.gt, Op.lt` |

### Example Query Conversions

**MongoDB:**
```javascript
const members = await Member.find({
  name: { $regex: search, $options: 'i' },
  status: 'active'
}).populate('assignedTrainer');
```

**PostgreSQL:**
```javascript
const { Op } = require('sequelize');
const members = await Member.findAll({
  where: {
    name: { [Op.iLike]: `%${search}%` },
    status: 'active'
  },
  include: [{ model: Trainer, as: 'assignedTrainer' }]
});
```

## Data Migration (If migrating existing data)

If you have existing MongoDB data to migrate:

1. **Export from MongoDB:**
```bash
mongoexport --db=elite-arena-gym --collection=members --out=members.json
```

2. **Create migration script:**
```javascript
// backend/scripts/migrateData.js
const { sequelize } = require('../config/database');
const db = require('../models');
const fs = require('fs');

async function migrate() {
  await sequelize.sync({ force: true });

  const members = JSON.parse(fs.readFileSync('members.json'));

  for (const member of members) {
    await db.Member.create({
      memberId: member.memberId,
      name: member.name,
      // ... map other fields
    });
  }
}

migrate();
```

## Testing

After migration, test all endpoints:

```bash
# Start server
npm run dev

# Test health endpoint
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elitearena.com","password":"Admin@123"}'
```

## Performance Optimization

### 1. Indexes
```javascript
// In model definitions
{
  indexes: [
    { fields: ['memberId'] },
    { fields: ['email'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
}
```

### 2. Query Optimization
- Use `attributes` to select only needed fields
- Use `include` with `attributes` to limit joined data
- Add database indexes on frequently queried fields

### 3. Connection Pooling
Already configured in `backend/config/database.js`:
```javascript
pool: {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000
}
```

## Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U gym_admin -d elite_arena_gym -h localhost
```

### Permission Issues
```sql
# Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gym_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gym_admin;
```

### Table Creation Issues
```bash
# Drop and recreate (WARNING: destroys data)
npm run migrate:reset
```

## Rollback Plan

If you need to rollback to MongoDB:

1. Keep MongoDB dependencies in `package.json` commented
2. Keep old model files backed up
3. Have MongoDB backup ready
4. Switch environment variables back
5. Restart with old code

## Support

For issues:
1. Check PostgreSQL logs: `/var/log/postgresql/`
2. Check application logs in console
3. Verify environment variables
4. Test database connection separately

## Benefits Achieved

✅ **Data Integrity**: Foreign key constraints ensure referential integrity
✅ **ACID Transactions**: Reliable data operations
✅ **Better Performance**: Optimized queries and indexes
✅ **JSON Support**: JSONB for flexible nested data
✅ **Advanced Queries**: Complex joins and aggregations
✅ **Industry Standard**: Wide adoption and support
✅ **Better Tooling**: PgAdmin, DataGrip, and more
✅ **Scalability**: Better horizontal and vertical scaling

## Next Steps

After successful migration:
1. Monitor performance metrics
2. Optimize slow queries
3. Set up automated backups
4. Configure replication (for production)
5. Implement connection pooling monitoring
6. Set up query logging for optimization
