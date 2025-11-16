# Admin Dashboard - AgriSmart Agricultural System

## Overview

The Admin Dashboard is a comprehensive management interface for the AgriSmart agricultural recommendation system. It provides administrators with tools to manage users, monitor system health, analyze data, and maintain the agricultural database.

## 🚀 Features

### Core Dashboard Components

#### 1. **Admin Authentication System**
- Secure admin login with role-based access
- Session management and token validation
- Demo credentials: `admin@agrismart.com` / `admin123`
- Role hierarchy: `admin` and `super_admin`

#### 2. **Overview Dashboard**
- Real-time system statistics
- User metrics and activity monitoring
- System health indicators
- Recent activity logs
- Revenue and performance analytics

#### 3. **Crop Management Interface**
- ✅ Full CRUD operations for crops
- Advanced filtering and search
- Season-based categorization
- Optimal growth parameters management
- CSV export functionality
- Real-time validation

#### 4. **Price Monitoring Dashboard**
- ✅ Real-time price prediction tracking
- Trend analysis with interactive charts
- Market location filtering
- Confidence level monitoring
- CSV export of prediction data
- Price movement distribution analysis

#### 5. **User Analytics**
- User registration trends
- Active user monitoring
- Geographic distribution
- Usage patterns analysis

#### 6. **System Monitoring**
- API health status
- Database connectivity checks
- Response time tracking
- Error rate monitoring
- Uptime calculations

#### 7. **Data Visualization**
- 📊 Interactive charts using Recharts
- Trend analysis with line/area charts
- Distribution analysis with pie charts
- Bar charts for comparisons
- Multi-line trend comparisons

## 🏗️ Architecture

### Frontend Structure
```
src/
├── components/
│   ├── admin/
│   │   ├── Charts.tsx           # Reusable chart components
│   │   ├── CropManager.tsx      # Crop management interface
│   │   └── PriceMonitor.tsx     # Price monitoring dashboard
│   └── Navbar.tsx               # Updated with admin navigation
├── contexts/
│   └── AdminAuthContext.tsx     # Admin authentication context
├── pages/
│   ├── AdminDashboard.tsx       # Main admin dashboard
│   └── AdminLogin.tsx           # Admin login page
└── App.tsx                     # Updated with admin routing
```

### Key Dependencies
- **Recharts**: Data visualization and charting
- **Headless UI**: Accessible component primitives
- **Date-fns**: Date manipulation utilities
- **React Table**: Table components (planned)
- **Lucide React**: Icon library

## 🔐 Security Features

### Authentication & Authorization
- Role-based access control (`admin`, `super_admin`)
- Secure session management
- JWT token validation
- Admin-only route protection
- Session timeout handling

### Database Security
- Row Level Security (RLS) policies
- Admin-specific database functions
- Secure API endpoints
- Input validation and sanitization

## 📊 Dashboard Capabilities

### 1. **System Statistics**
- Total users and recommendations
- Price prediction metrics
- Support ticket volumes
- System health scores
- Revenue calculations

### 2. **Crop Management**
- Add/Edit/Delete crop records
- Optimal growth parameters:
  - pH range management
  - Temperature requirements
  - Humidity specifications
  - Rainfall patterns
  - Soil type compatibility
- Seasonal categorization
- Growth duration tracking

### 3. **Price Monitoring**
- Real-time price predictions
- Market location analysis
- Confidence level tracking
- Trend visualization
- Export capabilities

### 4. **Health Monitoring**
- API response times
- Database connectivity
- Error rate tracking
- Uptime monitoring
- System alerts

## 🎯 User Interface

### Navigation Structure
- **Overview**: System statistics and health
- **Users**: User management and analytics
- **Crops**: Crop database management
- **Pricing**: Price monitoring and analysis
- **Schemes**: Government scheme management
- **Support**: Ticket management system
- **Analytics**: Data analysis and reporting
- **System**: System settings and configuration

### Responsive Design
- Mobile-friendly interface
- Collapsible sidebar navigation
- Touch-optimized controls
- Adaptive chart layouts

## 🔧 Installation & Setup

### 1. Install Dependencies
```bash
npm install recharts date-fns @headlessui/react react-table
```

### 2. Database Setup
Run the provided SQL migrations:
```sql
-- Backend Enhancement Tables
20251116085826_backend_enhancement_tables.sql

-- South Indian Crops Data
20251116085926_south_indian_crops_data.sql
```

### 3. Environment Configuration
Set up the following environment variables:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Admin User Setup
Create admin users in the `profiles` table with `role` set to `'admin'` or `'super_admin'`:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@agrismart.com';
```

## 📱 Usage Guide

### Accessing the Dashboard
1. Navigate to the main application
2. Click on "Admin" in the navigation menu
3. Login with admin credentials
4. Access dashboard features based on role permissions

### Key Workflows

#### Adding New Crops
1. Navigate to "Crop Management"
2. Click "Add Crop"
3. Fill in crop details:
   - Basic information (name, scientific name)
   - Optimal growth parameters
   - Seasonal requirements
   - Soil compatibility
4. Save to update the crop database

#### Monitoring Price Predictions
1. Navigate to "Price Monitoring"
2. Use filters to analyze specific crops/locations
3. View trend charts and statistics
4. Export data for further analysis

#### System Health Monitoring
1. Check the "Overview" dashboard
2. Monitor system health indicators
3. Review recent activity logs
4. Track performance metrics

## 📈 Data Analytics

### Available Charts
- **Line Charts**: Trend analysis over time
- **Area Charts**: Cumulative data visualization
- **Bar Charts**: Comparative analysis
- **Pie Charts**: Distribution breakdown
- **Multi-line Charts**: Trend comparisons

### Export Capabilities
- CSV export for crop data
- Price prediction data export
- User analytics export (planned)
- Custom date range exports

## 🚧 Future Enhancements

### Planned Features
- **Advanced Analytics Panel**
  - User behavior analysis
  - Geographic heatmaps
  - Predictive analytics

- **Support Ticket System**
  - Ticket management interface
  - Response time tracking
  - SLA monitoring

- **Government Schemes Manager**
  - CRUD operations for schemes
  - State-based categorization
  - Application tracking

- **User Management**
  - Detailed user analytics
  - Activity monitoring
  - Bulk user operations

### Technical Improvements
- Real-time WebSocket updates
- Advanced caching mechanisms
- Performance optimization
- Enhanced error handling

## 🔍 Troubleshooting

### Common Issues

#### Login Problems
- **Issue**: Admin credentials not working
- **Solution**: Check user role in profiles table

#### Dashboard Loading Issues
- **Issue**: Slow dashboard loading
- **Solution**: Check database indexes and query optimization

#### Chart Rendering Problems
- **Issue**: Charts not displaying
- **Solution**: Verify data format and Recharts installation

### Performance Optimization
- Implement data pagination
- Add loading states for async operations
- Optimize database queries with proper indexes
- Use React.memo for component optimization

## 🛡️ Security Considerations

### Best Practices
- Regular security audits
- Role-based access control reviews
- API rate limiting
- Input validation
- SQL injection prevention

### Monitoring
- Log all admin actions
- Monitor failed login attempts
- Track data export activities
- System access logging

## 📞 Support

For admin dashboard support:
1. Check the system health dashboard
2. Review system logs for errors
3. Verify database connectivity
4. Check browser console for JavaScript errors

---

**Note**: This admin dashboard is designed specifically for the AgriSmart agricultural recommendation system and requires proper authentication to access sensitive data and management functions.