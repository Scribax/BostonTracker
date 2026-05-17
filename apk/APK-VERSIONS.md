# 📱 Boston Tracker APK Versions

## 🚀 Current Version

### **v1.0.1-background-final** (Latest)
- **File**: `boston-tracker-v1.0.1-background-final-20250902-1116.apk`
- **Date**: September 2, 2024 - 11:16
- **Size**: ~66MB
- **Features**:
  - ✅ Background GPS tracking optimized
  - ✅ Battery usage improvements
  - ✅ Real-time location updates
  - ✅ Push notifications for delivery updates
  - ✅ Offline capability enhancements

### **Latest Symlink**
- **File**: `boston-tracker-latest.apk` → `boston-tracker-v1.0.1-background-final-20250902-1116.apk`
- **Purpose**: Always points to the most current version

## 📋 Installation Instructions

### For Delivery Drivers:
1. Download `boston-tracker-latest.apk`
2. Enable "Install from unknown sources" on Android
3. Install the APK
4. Login with credentials provided by management
5. Allow location permissions for GPS tracking

### For Development:
```bash
# Install via ADB
adb install boston-tracker-latest.apk

# Or install specific version
adb install boston-tracker-v1.0.1-background-final-20250902-1116.apk
```

## 🔧 Technical Details

- **Target Android**: API 21+ (Android 5.0+)
- **Architecture**: Universal (ARM64, ARM, x86, x86_64)
- **Permissions**: Location, Network, Notifications, Wake Lock
- **Dependencies**: React Native 0.72+, Expo SDK

## 📝 Version History

Previous versions have been cleaned up for repository organization. This directory now contains only the production-ready release.

## 🔗 Related Links

- **Live Demo**: [scribax.github.io/BostonTracker-Demo](https://scribax.github.io/BostonTracker-Demo/)
- **Main Repository**: Private development repository
- **Documentation**: See main project README

---

**Note**: APK files are large binaries and not included in regular git commits. They are managed separately in this directory.
