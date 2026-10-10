import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');
const publicDownloadsDir = path.join(projectRoot, 'public', 'downloads');
const distDownloadsDir = path.join(projectRoot, 'dist', 'downloads');

console.log('📦 Starting Curewell Android APK Build Workflow...');

// 1. Ensure public/downloads exists
if (!fs.existsSync(publicDownloadsDir)) {
  fs.mkdirSync(publicDownloadsDir, { recursive: true });
}

// 2. Locate Android SDK
function findAndroidSdk() {
  if (process.env.ANDROID_HOME && fs.existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }
  if (process.env.ANDROID_SDK_ROOT && fs.existsSync(process.env.ANDROID_SDK_ROOT)) {
    return process.env.ANDROID_SDK_ROOT;
  }

  const homedir = os.homedir();
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
    path.join(homedir, 'AppData', 'Local', 'Android', 'Sdk'),
    path.join(homedir, 'Library', 'Android', 'sdk'),
    path.join(homedir, 'Android', 'Sdk'),
    'C:\\Android\\Sdk'
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

const sdkPath = findAndroidSdk();

if (sdkPath) {
  console.log(`✅ Android SDK located at: ${sdkPath}`);
  const localPropertiesPath = path.join(androidDir, 'local.properties');
  const sanitizedPath = sdkPath.replace(/\\/g, '/');
  fs.writeFileSync(localPropertiesPath, `sdk.dir=${sanitizedPath}\n`, 'utf8');
} else {
  console.warn('⚠️ No Android SDK found in standard paths or ANDROID_HOME.');
}

// 3. Sync Web Assets with Capacitor
console.log('🔄 Syncing web assets with Capacitor Android...');
try {
  execSync('npx cap sync android', { stdio: 'inherit', cwd: projectRoot });
} catch (err) {
  console.error('❌ Failed to sync Capacitor assets:', err.message);
  process.exit(1);
}

// 4. Build APK via Gradle if SDK is present
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradlewPath = path.join(androidDir, gradlewCmd);

if (fs.existsSync(gradlewPath) && sdkPath) {
  console.log('🚀 Compiling Android APK with Gradle (assembleDebug)...');
  try {
    execSync(`${gradlewCmd} assembleDebug`, { stdio: 'inherit', cwd: androidDir });

    const apkOutput = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apkOutput)) {
      const targetApk = path.join(publicDownloadsDir, 'Curewell.apk');
      fs.copyFileSync(apkOutput, targetApk);
      console.log(`\n🎉 SUCCESS! APK compiled successfully:`);
      console.log(`   Direct Download Path: public/downloads/Curewell.apk`);
      console.log(`   Android Build Output: ${apkOutput}`);

      if (fs.existsSync(path.join(projectRoot, 'dist'))) {
        if (!fs.existsSync(distDownloadsDir)) {
          fs.mkdirSync(distDownloadsDir, { recursive: true });
        }
        fs.copyFileSync(apkOutput, path.join(distDownloadsDir, 'Curewell.apk'));
      }

      fs.writeFileSync(
        path.join(publicDownloadsDir, 'status.json'),
        JSON.stringify({
          built: true,
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          file: '/downloads/Curewell.apk',
          sizeBytes: fs.statSync(targetApk).size
        }, null, 2)
      );
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Gradle build failed:', err.message);
  }
} else {
  console.log('\nℹ️ Note: Android SDK is not installed on this local system.');
  console.log('To generate an APK:');
  console.log('  1. Option A (Cloud): Push to GitHub or trigger .github/workflows/build-apk.yml (automated build in 2 mins)');
  console.log('  2. Option B (Android Studio): Install Android Studio & run "npm run cap:open" to build & run on your phone.');
  console.log('  3. Option C (Local SDK): Install Android Command-line tools or set ANDROID_HOME environment variable.\n');

  fs.writeFileSync(
    path.join(publicDownloadsDir, 'status.json'),
    JSON.stringify({
      built: false,
      reason: 'Local Android SDK not configured. Use GitHub Actions cloud build or Android Studio.',
      timestamp: new Date().toISOString()
    }, null, 2)
  );
}
