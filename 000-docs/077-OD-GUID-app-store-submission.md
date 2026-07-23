# DiagnosticPro - App Store Deployment Guide

✅ **Capacitor Setup Complete!** Your React app is now ready for iOS and Android app stores.

## 📱 What Was Just Created

```
02-src/frontend/
├── ios/                    ← iOS Xcode project (for App Store)
├── android/               ← Android Studio project (for Play Store)
├── capacitor.config.ts    ← Mobile app configuration
└── dist/                  ← Built web assets (synced to native apps)
```

---

## 🎯 Next Steps Overview

1. **Create App Icons** (Required)
2. **Set Up Developer Accounts** (Required - costs money)
3. **Build Native Apps** (Xcode for iOS, Android Studio for Android)
4. **Submit to App Stores**

---

## 🎨 Step 1: Create App Icons

You need a **1024x1024px** app icon. Use a tool like:
- **Figma** (free)
- **Canva** (free)
- **Adobe Illustrator**

### Icon Requirements:
- **Size**: 1024x1024px
- **Format**: PNG (no transparency for iOS)
- **Design**: Simple, recognizable DiagnosticPro logo
- **Colors**: Use your brand colors (#4285F4 blue)

### Generate Icon Sets

Once you have your 1024x1024px icon:

```bash
# Option 1: Use online tool (EASIEST)
# Visit: https://www.appicon.co
# Upload your 1024x1024 icon
# Download iOS and Android icon sets

# Option 2: Use Capacitor Assets plugin
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#4285F4'
```

Place your icon at:
- `02-src/frontend/resources/icon.png` (1024x1024)

Then run:
```bash
npx capacitor-assets generate
```

---

## 💳 Step 2: Set Up Developer Accounts

### Apple Developer Account (iOS)
**Cost**: $99/year
**URL**: https://developer.apple.com/programs/

1. Sign up with your Apple ID
2. Pay $99 annual fee
3. Complete enrollment (takes 24-48 hours for approval)
4. Enable Two-Factor Authentication

### Google Play Developer Account (Android)
**Cost**: $25 one-time
**URL**: https://play.google.com/console/signup

1. Create Google account (or use existing)
2. Pay $25 one-time registration fee
3. Complete merchant account setup
4. Verify identity (takes 24-48 hours)

---

## 📱 Step 3: Build iOS App (macOS Only)

**Requirements:**
- macOS computer
- Xcode 15+ installed (free from Mac App Store)
- Apple Developer Account

### Open iOS Project

```bash
cd 02-src/frontend
npx cap open ios
```

### Configure in Xcode

1. **Select Team**:
   - Click project name in left sidebar
   - Select "DiagnosticPro" target
   - Go to "Signing & Capabilities" tab
   - Select your Apple Developer team

2. **Set Bundle Identifier**:
   - Should already be: `io.diagnosticpro.app`
   - This MUST match your App Store Connect app

3. **Add App Icons**:
   - Open `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Drag your generated icons into the slots

4. **Set Version & Build**:
   - Version: `1.0.0`
   - Build: `1`

### Build for App Store

1. In Xcode menu: **Product** → **Archive**
2. Wait for archive to complete (~5-10 minutes)
3. When done, **Organizer** window opens
4. Click **Distribute App**
5. Choose **App Store Connect**
6. Click **Upload**
7. Wait for upload (~10-15 minutes)

---

## 🤖 Step 4: Build Android App

**Requirements:**
- Android Studio installed (free download)
- Google Play Developer Account

### Open Android Project

```bash
cd 02-src/frontend
npx cap open android
```

### Configure in Android Studio

1. **Wait for Gradle sync** to complete (~2-5 minutes first time)

2. **Set Package Name**:
   - Should already be: `io.diagnosticpro.app`
   - Found in `android/app/build.gradle`

3. **Add App Icons**:
   - Icons should already be synced from capacitor-assets
   - Check `android/app/src/main/res/mipmap-*/` folders

4. **Set Version**:
   - Open `android/app/build.gradle`
   - Update:
     ```gradle
     versionCode 1
     versionName "1.0.0"
     ```

### Create Signing Key (CRITICAL - DO THIS ONCE)

```bash
cd android/app

# Generate keystore (SAVE THIS FILE FOREVER!)
keytool -genkey -v -keystore diagnosticpro-release.keystore \
  -alias diagnosticpro -keyalg RSA -keysize 2048 -validity 10000

# Enter a strong password (SAVE THIS PASSWORD!)
# Fill in organization details when prompted
```

**⚠️ CRITICAL**: Back up `diagnosticpro-release.keystore` and password!
- If you lose this, you can NEVER update your app!
- Store in password manager + cloud backup

### Configure Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=diagnosticpro
storeFile=app/diagnosticpro-release.keystore
```

**⚠️ Add to .gitignore** (never commit secrets):

```bash
echo "android/key.properties" >> .gitignore
echo "android/app/*.keystore" >> .gitignore
```

### Build Release APK/AAB

In Android Studio:

1. **Build** → **Generate Signed Bundle/APK**
2. Choose **Android App Bundle** (AAB) - required for Play Store
3. Select keystore: `app/diagnosticpro-release.keystore`
4. Enter keystore password
5. Select key alias: `diagnosticpro`
6. Enter key password
7. Choose **release** build variant
8. Click **Finish**

Output: `android/app/release/app-release.aab`

---

## 🚀 Step 5: Submit to App Store Connect (iOS)

**URL**: https://appstoreconnect.apple.com

### Create App Listing

1. Click **My Apps** → **+** → **New App**
2. Fill in details:
   - **Platforms**: iOS
   - **Name**: DiagnosticPro
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: `io.diagnosticpro.app`
   - **SKU**: `io.diagnosticpro.app.1`
   - **User Access**: Full Access

3. **App Information**:
   - **Subtitle**: "AI-Powered Equipment Diagnostics"
   - **Category**: Primary: Utilities, Secondary: Productivity
   - **Content Rights**: No (you own the content)

4. **Pricing**:
   - **Price**: Free
   - **Availability**: All countries

5. **App Privacy**:
   - Create privacy policy at `https://diagnosticpro.io/privacy`
   - Add URL to App Store listing
   - Declare data types collected (email, payment info via Stripe)

### Add Screenshots

Required sizes (use iOS Simulator in Xcode):
- **6.7" Display** (iPhone 15 Pro Max): 1290 x 2796px (3-10 screenshots)
- **6.5" Display** (iPhone 14 Plus): 1284 x 2778px
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208px

Take screenshots of:
1. Home screen
2. Diagnostic form
3. Payment screen
4. Report example (if possible without real data)
5. Features/benefits

### App Description

```
DiagnosticPro - AI-Powered Equipment Diagnostics

Get professional diagnostic reports for vehicles and equipment in minutes - just $4.99.

WHAT YOU GET:
• 15-section comprehensive analysis
• Conversation scripts for talking to mechanics
• Scam detection and ripoff protection
• Cost breakdowns and fair pricing
• Technical questions to verify competence
• OEM parts recommendations
• Negotiation tactics

HOW IT WORKS:
1. Describe your equipment problem
2. Pay $4.99 securely
3. Receive detailed PDF report
4. Take it to any repair shop

EQUIPMENT SUPPORTED:
• Vehicles (cars, trucks, motorcycles)
• Machinery (construction, agricultural)
• Industrial equipment
• Electronics and appliances

Save hundreds by knowing what to ask and what to avoid!
```

### Submit for Review

1. Upload build (already done in Xcode)
2. Add screenshots
3. Fill in all required fields
4. Click **Save**
5. Click **Submit for Review**
6. Answer questions:
   - Export Compliance: No (if you're not using encryption beyond HTTPS)
   - Content Rights: You own all content
   - Advertising ID: No (if not using ads)

**Review Time**: 1-3 days typically

---

## 🤖 Step 6: Submit to Google Play Console (Android)

**URL**: https://play.google.com/console

### Create App

1. **All apps** → **Create app**
2. Fill in:
   - **App name**: DiagnosticPro
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all boxes

3. **Store listing**:

   **Short description** (80 chars max):
   ```
   AI diagnostic reports for vehicles & equipment - $4.99
   ```

   **Full description** (4000 chars max):
   ```
   Get professional AI-assisted diagnostic reports for vehicles and equipment in minutes for just $4.99.

   WHAT YOU GET:
   • 15-section comprehensive analysis
   • Root cause diagnosis with confidence levels
   • Conversation scripts for talking to mechanics
   • Shop interrogation questions
   • Scam detection and ripoff alerts
   • Cost breakdowns and fair pricing guides
   • OEM parts strategy
   • Professional negotiation tactics

   HOW IT WORKS:
   1. Fill out our simple diagnostic form
   2. Describe your equipment symptoms
   3. Pay $4.99 securely via Stripe
   4. Receive detailed PDF report in minutes
   5. Take it to any repair shop

   EQUIPMENT TYPES SUPPORTED:
   • Automobiles (cars, trucks, SUVs)
   • Motorcycles
   • Construction equipment
   • Agricultural machinery
   • Industrial equipment
   • Electronics and appliances

   WHY DIAGNOSTICPRO?
   ✓ Save hundreds on diagnostic fees
   ✓ Arm yourself with technical knowledge
   ✓ Spot scams before they happen
   ✓ Know fair pricing before repairs
   ✓ Professional analysis from AI trained on thousands of cases

   POWERED BY GOOGLE VERTEX AI
   Our diagnostic engine uses advanced AI to analyze your equipment issues and provide comprehensive reports you can trust.

   Privacy Policy: https://diagnosticpro.io/privacy
   Terms of Service: https://diagnosticpro.io/terms
   ```

4. **App icon**: Upload 512x512px PNG

5. **Screenshots**: Required for Phone, 7-inch Tablet, 10-inch Tablet
   - Phone: 16:9 or 9:16, at least 320px shortest side
   - Take 2-8 screenshots from Android emulator

6. **Feature graphic**: 1024w x 500h JPG/PNG (banner for Play Store)

7. **Categorization**:
   - **Category**: Tools
   - **Tags**: diagnostic, repair, automotive, AI, equipment

8. **Contact details**:
   - **Email**: Your support email
   - **Website**: https://diagnosticpro.io
   - **Phone**: (optional)

9. **Privacy Policy**: https://diagnosticpro.io/privacy

### Set Up App Content

1. **App access**: All functionality available without restrictions

2. **Ads**: No (assuming you don't show ads)

3. **Content rating**:
   - Complete questionnaire
   - Should get **Everyone** rating

4. **Target audience**:
   - Age: 18+

5. **News app**: No

6. **COVID-19 contact tracing**: No

7. **Data safety**:
   - Collects: Email, Payment info (via Stripe)
   - Shares: Payment info with Stripe
   - Security: Data encrypted in transit
   - Deletion: Users can request deletion

### Upload AAB

1. **Production** → **Create new release**
2. Click **Upload**
3. Select `app-release.aab`
4. Wait for upload (~2-5 minutes)
5. **Release name**: `1.0.0 (1)`
6. **Release notes**:
   ```
   Initial release of DiagnosticPro!

   • AI-powered diagnostic reports
   • 15-section comprehensive analysis
   • $4.99 per diagnostic
   • Instant PDF delivery
   ```

7. Click **Save** → **Review release** → **Start rollout to Production**

**Review Time**: 3-7 days typically (first apps take longer)

---

## 🔄 Updating Your Apps (Future)

When you make changes to your React app:

```bash
cd 02-src/frontend

# 1. Make your code changes

# 2. Rebuild React app
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Increment version numbers
# iOS: Xcode → General → Version (1.0.0 → 1.1.0)
# Android: android/app/build.gradle → versionName & versionCode

# 5. Open and rebuild
npx cap open ios      # Build in Xcode → Archive → Upload
npx cap open android  # Build AAB in Android Studio → Upload
```

---

## ⚠️ Critical Mobile-Specific Issues to Fix

### 1. Stripe Payment Flow

Your current Stripe implementation uses web redirects. This **won't work** in mobile apps.

**You need to**:
```bash
npm install @capacitor-community/stripe
```

Update payment code to use Stripe's mobile SDK instead of redirect checkout.

### 2. API Configuration

Update API URLs to work in mobile context:

Create `02-src/frontend/src/config/mobile.ts`:

```typescript
import { Capacitor } from '@capacitor/core';

export const isMobile = Capacitor.isNativePlatform();

export const API_BASE_URL = isMobile
  ? 'https://diagnosticpro-vertex-ai-backend-298932670545.us-central1.run.app'
  : import.meta.env.VITE_API_BASE || 'http://localhost:8080';
```

Use this in all API calls instead of hardcoded URLs.

### 3. File Downloads

PDF downloads need special handling in mobile apps. Consider using:
```bash
npm install @capacitor/filesystem
npm install @capacitor/share
```

Then implement native file save and share instead of web downloads.

---

## 📋 Checklist Before Submission

### Both Platforms
- [ ] App icons generated and added
- [ ] Version set to 1.0.0, build 1
- [ ] Privacy policy published at diagnosticpro.io/privacy
- [ ] Terms of service published at diagnosticpro.io/terms
- [ ] Screenshots taken (3-8 per required size)
- [ ] App description written
- [ ] Stripe mobile payments tested

### iOS Specific
- [ ] Apple Developer Account active ($99 paid)
- [ ] App created in App Store Connect
- [ ] Build uploaded from Xcode
- [ ] All required screenshot sizes provided
- [ ] Export compliance answered (No)
- [ ] Test on real iPhone device

### Android Specific
- [ ] Google Play Developer Account active ($25 paid)
- [ ] Keystore created and backed up
- [ ] AAB signed and uploaded
- [ ] Content rating completed
- [ ] Data safety section filled
- [ ] Test on real Android device

---

## 🎯 Timeline Estimate

| Task | Time Required |
|------|---------------|
| Create app icons | 1-2 hours |
| Apple Developer signup | 24-48 hours (approval) |
| Google Play signup | 24-48 hours (verification) |
| iOS build & upload | 1-2 hours |
| Android build & upload | 1-2 hours |
| iOS App Store review | 1-3 days |
| Google Play review | 3-7 days |
| **Total** | **5-10 days from start to live** |

---

## 💰 Total Costs

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Google Play Developer Account | $25 one-time |
| **Total First Year** | **$124** |
| **Total Subsequent Years** | **$99/year** |

---

## 🆘 Need Help?

### Resources
- **Capacitor Docs**: https://capacitorjs.com/docs
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Store Policies**: https://play.google.com/console/about/guides/

### Common Issues
- **"No such module 'Capacitor'"**: Run `npx cap sync`
- **"Build failed in Xcode"**: Clean build folder (Cmd+Shift+K)
- **"Keystore not found"**: Check path in android/key.properties
- **"Upload rejected"**: Increment build number

---

## ✅ You're Ready!

Your DiagnosticPro mobile apps are configured and ready for submission. Follow this guide step-by-step, and you'll have apps in both stores within 1-2 weeks!

**Good luck! 🚀**
