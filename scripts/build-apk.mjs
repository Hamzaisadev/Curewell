import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const projectRoot = process.cwd();
const mobileDir = path.join(projectRoot, 'mobile');
const androidDir = path.join(mobileDir, 'android');
const publicDownloadsDir = path.join(projectRoot, 'public', 'downloads');
const distDownloadsDir = path.join(projectRoot, 'dist', 'downloads');

console.log('📦 Starting Curewell Standalone React Native Android APK Build Workflow...');

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
    'C:\\Android\\Sdk',
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
} else {
  console.warn('⚠️ No Android SDK found in standard paths or ANDROID_HOME.');
}

// 3. Install React Native dependencies & prebuild native Android project
if (sdkPath && fs.existsSync(mobileDir)) {
  console.log('🔄 Preparing standalone React Native Android project (mobile/)...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: mobileDir });
    execSync('npx expo prebuild --platform android --clean', {
      stdio: 'inherit',
      cwd: mobileDir,
      env: { ...process.env, CI: '1' },
    });

    if (fs.existsSync(androidDir)) {
      const localPropertiesPath = path.join(androidDir, 'local.properties');
      const sanitizedPath = sdkPath.replace(/\\/g, '/');
      fs.writeFileSync(localPropertiesPath, `sdk.dir=${sanitizedPath}\n`, 'utf8');
    }
  } catch (err) {
    console.error('❌ Failed to prebuild React Native Android project:', err.message);
    process.exit(1);
  }
}

// 4. Build APK via Gradle if SDK is present
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradlewPath = path.join(androidDir, gradlewCmd);

if (fs.existsSync(gradlewPath) && sdkPath) {
  console.log('🚀 Compiling Standalone React Native Android APK with Gradle (assembleRelease)...');
  try {
    execSync(`${gradlewCmd} assembleRelease --no-daemon`, { stdio: 'inherit', cwd: androidDir });

    const releaseApk = path.join(
      androidDir,
      'app',
      'build',
      'outputs',
      'apk',
      'release',
      'app-release.apk'
    );
    const debugApk = path.join(
      androidDir,
      'app',
      'build',
      'outputs',
      'apk',
      'debug',
      'app-debug.apk'
    );
    const apkOutput = fs.existsSync(releaseApk) ? releaseApk : debugApk;

    if (fs.existsSync(apkOutput)) {
      const targetApk = path.join(publicDownloadsDir, 'Curewell.apk');
      fs.copyFileSync(apkOutput, targetApk);
      console.log('\n🎉 SUCCESS! Standalone React Native APK compiled successfully:');
      console.log('   Direct Download Path: public/downloads/Curewell.apk');
      console.log(`   Android Build Output: ${apkOutput}`);

      if (fs.existsSync(path.join(projectRoot, 'dist'))) {
        if (!fs.existsSync(distDownloadsDir)) {
          fs.mkdirSync(distDownloadsDir, { recursive: true });
        }
        fs.copyFileSync(apkOutput, path.join(distDownloadsDir, 'Curewell.apk'));
      }

      fs.writeFileSync(
        path.join(publicDownloadsDir, 'status.json'),
        JSON.stringify(
          {
            built: true,
            engine: 'React Native (Standalone Native Android + Widget + AlarmManager)',
            appId: 'com.curewell.health',
            appName: 'Curewell',
            version: '4.0.0',
            timestamp: new Date().toISOString(),
            file: '/downloads/Curewell.apk',
            sizeBytes: fs.statSync(targetApk).size,
          },
          null,
          2
        )
      );
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Gradle build failed:', err.message);
  }
} else {
  console.log('\nℹ️ Note: Android SDK is not installed on this local system.');
  console.log('To generate the standalone React Native APK:');
  console.log(
    '  1. Option A (Cloud): Push to GitHub or trigger .github/workflows/build-apk.yml (automated React Native build)'
  );
  console.log(
    '  2. Option B (Local SDK): Install Android SDK / set ANDROID_HOME and run "npm run build:apk".\n'
  );
}
