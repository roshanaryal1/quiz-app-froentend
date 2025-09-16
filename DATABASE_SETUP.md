# 🗄️ Database Setup Guide for Tournament Persistence

## 🔍 **Current Problem**
Your tournaments are disappearing after page refresh because:
- **Render.com free tier** doesn't provide persistent database storage
- **Backend uses in-memory storage** which resets when server restarts
- **No permanent database** connection configured

## 🛠️ **Solution Options**

### **Option 1: PlanetScale MySQL (Recommended - Free)**
```bash
# 1. Sign up at https://planetscale.com
# 2. Create a new database called "quiz_tournaments"
# 3. Get connection string from dashboard
# 4. Add to your backend .env file:

DATABASE_URL="mysql://username:password@host/quiz_tournaments?sslaccept=strict"
DB_HOST=your-host.planetscale.sh
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=quiz_tournaments
```

### **Option 2: Railway.app PostgreSQL (Free)**
```bash
# 1. Sign up at https://railway.app
# 2. Create new project with PostgreSQL
# 3. Get connection details from dashboard
# 4. Add to your backend .env file:

DATABASE_URL="postgresql://username:password@host:port/database"
```

### **Option 3: Local MySQL with Workbench (Development)**
```sql
-- 1. Install MySQL and MySQL Workbench
-- 2. Create database and tables:

CREATE DATABASE quiz_tournaments;
USE quiz_tournaments;

-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'PLAYER') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tournaments table
CREATE TABLE tournaments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    minimum_passing_score INT DEFAULT 70,
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- Tournament attempts table
CREATE TABLE tournament_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournament_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_tournament (user_id, tournament_id)
);

-- For local development, add to backend .env:
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your-mysql-password
DB_NAME=quiz_tournaments
```

## 🔧 **Backend Configuration Required**

### **1. Add Database Dependencies (Spring Boot)**
```xml
<!-- In your backend pom.xml -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### **2. Backend application.properties**
```properties
# Database Configuration
spring.datasource.url=${DATABASE_URL:jdbc:mysql://localhost:3306/quiz_tournaments}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:password}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect

# Connection Pool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
```

## 🚀 **Quick Setup Steps**

### **Step 1: Choose Database Provider**
1. **PlanetScale** (Recommended): Free MySQL with automatic scaling
2. **Railway.app**: Free PostgreSQL with easy setup
3. **Local MySQL**: For development with MySQL Workbench

### **Step 2: Update Backend Code**
```java
// Add JPA entities for persistent storage
@Entity
@Table(name = "tournaments")
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    // ... other fields
}
```

### **Step 3: Test Database Connection**
```bash
# Test database connectivity
curl -X GET "https://your-backend.onrender.com/api/health"
```

## 🎯 **Expected Results After Setup**
- ✅ **Permanent tournaments** - Won't disappear after refresh
- ✅ **Data persistence** - Survives server restarts
- ✅ **User history** - Proper tracking of attempts and scores
- ✅ **Production ready** - Scalable database solution

## 🆘 **Need Help?**
1. Check browser console for database connection errors
2. Test backend API endpoints directly
3. Verify database credentials in backend .env
4. Use MySQL Workbench to inspect data directly

---
**Note**: This is a backend database configuration issue, not a frontend problem. Your React app is working correctly!
