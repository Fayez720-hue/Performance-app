# Capacitor & NextAuth ProGuard Rules (Simplified)
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.BridgeActivity
-keep class * extends com.getcapacitor.Plugin

# Essential Attributes
-keepattributes *Annotation*,JavascriptInterface,Signature

# Webview Interface Fix
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Crypto Fixes
-dontwarn com.google.crypto.tink.**
-dontwarn jose.**
