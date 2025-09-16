# 🔌 COMPREHENSIVE PORT CONFIGURATION GUIDE
## Souk El-Syarat - Professional Port Management

### 🎯 **PORT CONFIGURATION STRATEGY**

Your application uses **TWO DIFFERENT DEPLOYMENT METHODS** with different port requirements:

#### **1. Firebase App Hosting (Primary)**
- **External Port**: `443` (HTTPS) - Handled by Firebase
- **Internal Port**: `8080` (HTTP) - Your application listens here
- **Configuration**: `apphosting.yaml` sets `PORT=8080`
- **Server**: `server.js` listens on `process.env.PORT || 8080`

#### **2. Cloud Run (Alternative)**
- **External Port**: `443` (HTTPS) - Handled by Cloud Run
- **Internal Port**: `8080` (HTTP) - Your application listens here
- **Configuration**: `--port 8080` in deployment scripts
- **Server**: `server.js` listens on `process.env.PORT || 8080`

### 🔧 **CURRENT PORT CONFIGURATIONS**

| Service | Port | Purpose | Status |
|---------|------|---------|---------|
| **Firebase App Hosting** | `8080` | Internal HTTP | ✅ **CORRECT** |
| **Cloud Run** | `8080` | Internal HTTP | ✅ **CORRECT** |
| **Vite Dev Server** | `5173` | Development | ✅ **CORRECT** |
| **Vite Preview** | `4173` | Preview | ✅ **CORRECT** |
| **Firebase Emulators** | `8080` | Local Testing | ✅ **CORRECT** |
| **API Proxy** | `3000` | Development | ✅ **CORRECT** |

### 🚀 **DEPLOYMENT METHODS**

#### **Method 1: Firebase App Hosting (Recommended)**
```bash
# Deploy using Firebase App Hosting
firebase deploy --only apphosting
```
- **Port**: `8080` (internal)
- **External**: `443` (HTTPS) - handled by Firebase
- **Configuration**: `apphosting.yaml`

#### **Method 2: Cloud Run Direct**
```bash
# Deploy using Cloud Run
gcloud run deploy my-web-app --source . --port 8080
```
- **Port**: `8080` (internal)
- **External**: `443` (HTTPS) - handled by Cloud Run
- **Configuration**: `cloudbuild.yaml`

### 🔍 **PORT VERIFICATION**

#### **Check Current Configuration**
```bash
# Check server port
echo $PORT

# Test local server
curl http://localhost:8080/health

# Test production server
curl https://your-domain.com/health
```

#### **Debug Port Issues**
```bash
# Check what's listening on port 8080
netstat -an | findstr :8080

# Check process using port
lsof -i :8080
```

### ⚠️ **COMMON PORT ISSUES & SOLUTIONS**

#### **Issue 1: Port Already in Use**
```
Error: EADDRINUSE: address already in use :::8080
```
**Solution**:
```bash
# Kill process using port 8080
npx kill-port 8080

# Or find and kill specific process
lsof -ti:8080 | xargs kill -9
```

#### **Issue 2: Permission Denied**
```
Error: EACCES: permission denied, bind :::8080
```
**Solution**:
```bash
# Use a different port for development
PORT=3001 npm run dev

# Or run with elevated permissions (not recommended)
sudo npm run dev
```

#### **Issue 3: Container Port Mismatch**
```
Error: Container failed to start and listen on port defined by PORT=8080
```
**Solution**:
- Verify `apphosting.yaml` has `PORT: "8080"`
- Verify `server.js` uses `process.env.PORT || 8080`
- Verify server binds to `0.0.0.0`, not `localhost`

### 🎯 **BEST PRACTICES**

#### **1. Environment-Specific Ports**
```javascript
// server.js
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
```

#### **2. Port Validation**
```javascript
// Validate port before starting
const port = parseInt(process.env.PORT || '8080', 10);
if (isNaN(port) || port < 1 || port > 65535) {
  throw new Error('Invalid port number');
}
```

#### **3. Graceful Port Handling**
```javascript
// Handle port conflicts gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});
```

### 📊 **MONITORING & DEBUGGING**

#### **Health Check Endpoints**
- **Local**: `http://localhost:8080/health`
- **Production**: `https://your-domain.com/health`
- **API Status**: `https://your-domain.com/api/status`

#### **Port Monitoring**
```bash
# Monitor port usage
watch -n 1 'netstat -an | grep :8080'

# Monitor server logs
tail -f server.log | grep -i port
```

### 🎉 **EXPECTED OUTCOME**

With these configurations:
- ✅ **Firebase App Hosting** will work with port 8080
- ✅ **Cloud Run** will work with port 8080
- ✅ **Local development** will work with port 5173
- ✅ **No port conflicts** between services
- ✅ **Consistent port management** across environments

### 🚨 **CRITICAL NOTES**

1. **Never use port 443** in your application code - it's handled by the platform
2. **Always use port 8080** for internal application listening
3. **Firebase App Hosting** and **Cloud Run** both expect port 8080
4. **External HTTPS (443)** is handled automatically by the platform
5. **Development ports** (5173, 4173) are separate from production ports

This configuration ensures your application works correctly across all deployment methods and environments.
