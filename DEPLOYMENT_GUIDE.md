# Deployment Guide - Neura-X Guardian Angel

This guide provides step-by-step instructions for deploying the Neura-X Guardian Angel application in various environments.

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- MongoDB (optional, for data persistence)
- Git (for cloning repository)

## Quick Deployment

### 1. Extract and Setup

```bash
# Extract the zip file
unzip neura-x-guardian-angel-fixed.zip
cd neura-x-guardian-angel-fixed

# Install all dependencies and build frontend
npm run setup
```

### 2. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start the Application

```bash
# Production mode
npm start

# Development mode
npm run dev
```

The application will be available at `http://localhost:3001`

## Detailed Deployment Steps

### Step 1: System Requirements

Ensure your system meets the requirements:

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check npm version
npm --version   # Should be 8.0.0 or higher
```

### Step 2: Project Setup

```bash
# Navigate to project directory
cd neura-x-guardian-angel-fixed

# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-frontend

# Build frontend for production
npm run build-frontend
```

### Step 3: Environment Configuration

Create and configure the `.env` file:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# MongoDB Configuration (optional)
MONGODB_URI=mongodb://localhost:27017/neura-x-guardian-angel

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN=*
```

### Step 4: Database Setup (Optional)

If using MongoDB:

```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify MongoDB is running
sudo systemctl status mongodb
```

### Step 5: Start the Application

```bash
# Start in production mode
npm start

# Or start in development mode
npm run dev
```

## Production Deployment

### Using PM2 Process Manager

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'neura-x-guardian-angel',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'development'
       },
       env_production: {
         NODE_ENV: 'production',
         PORT: 3001
       }
     }]
   };
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

### Using Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   COPY frontend/package*.json ./frontend/

   # Install dependencies
   RUN npm install
   RUN npm run install-frontend

   # Copy source code
   COPY . .

   # Build frontend
   RUN npm run build-frontend

   # Expose port
   EXPOSE 3001

   # Start application
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t neura-x-guardian-angel .
   docker run -p 3001:3001 neura-x-guardian-angel
   ```

### Using Docker Compose

1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/neura-x-guardian-angel
       depends_on:
         - mongo
       restart: unless-stopped

     mongo:
       image: mongo:latest
       ports:
         - "27017:27017"
       volumes:
         - mongo_data:/data/db
       restart: unless-stopped

   volumes:
     mongo_data:
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

## Reverse Proxy Setup (Nginx)

### Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/neura-x-guardian-angel`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/neura-x-guardian-angel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logs

### Application Logs

```bash
# View logs in real-time
npm start | tee app.log

# With PM2
pm2 logs neura-x-guardian-angel

# View specific log files
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Monitoring

The application provides a health endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-06-28T01:23:00.059Z",
  "uptime": 49.138443158,
  "environment": "production"
}
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port 3001
   sudo lsof -i :3001
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Permission denied:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x server.js
   ```

3. **MongoDB connection error:**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongodb
   # Restart MongoDB
   sudo systemctl restart mongodb
   ```

4. **Frontend not loading:**
   ```bash
   # Rebuild frontend
   npm run build-frontend
   # Check public directory
   ls -la public/
   ```

### Performance Optimization

1. **Enable gzip compression** (already included in server.js)
2. **Use CDN** for static assets
3. **Configure caching** in Nginx
4. **Monitor memory usage** with PM2
5. **Use clustering** for multiple CPU cores

### Security Checklist

- [ ] Change default ports
- [ ] Configure firewall (ufw)
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limiting
- [ ] Update dependencies regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication

## Backup and Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --db neura-x-guardian-angel --out /backup/

# Restore
mongorestore /backup/neura-x-guardian-angel/
```

### Application Backup

```bash
# Create backup
tar -czf neura-x-backup-$(date +%Y%m%d).tar.gz neura-x-guardian-angel-fixed/

# Restore
tar -xzf neura-x-backup-20250628.tar.gz
```

## Support

For deployment issues:
1. Check the logs first
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Test the health endpoint
5. Check firewall and network settings

For additional support, refer to the main README.md file or open an issue in the repository.

