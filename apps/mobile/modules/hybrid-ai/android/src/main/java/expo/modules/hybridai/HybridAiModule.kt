@file:OptIn(PublicPreviewAPI::class)

package expo.modules.hybridai

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.SystemClock
import android.util.Base64
import com.google.firebase.Firebase
import com.google.firebase.FirebaseApp
import com.google.firebase.ai.ai
import com.google.firebase.ai.GenerativeModel
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.InferenceSource
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.ondevice.DownloadStatus
import com.google.firebase.ai.ondevice.FirebaseAIOnDevice
import com.google.firebase.ai.ondevice.OnDeviceModelStatus
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.PublicPreviewAPI
import com.google.firebase.ai.type.content
import com.google.firebase.ai.type.generationConfig
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout

private const val CLOUD_MODEL = "gemini-3.5-flash-lite"
private const val MAX_TIMEOUT_MS = 120_000L
private const val DEBUG_TOKEN_META_KEY = "dev.scenespeak.APP_CHECK_DEBUG_TOKEN"
// Where firebase-appcheck-debug keeps its secret (StorageHelper); a seeded value is used as the debug token.
private const val DEBUG_STORE_TEMPLATE = "com.google.firebase.appcheck.debug.store.%s"
private const val DEBUG_SECRET_KEY = "com.google.firebase.appcheck.debug.DEBUG_SECRET"

class HybridAiException(code: String, message: String, cause: Throwable? = null) : CodedException(code, message, cause)

// Firebase AI Logic hybrid inference (Gemini Nano via firebase-ai-ondevice). Mirrors HybridModel in
// src/ai-port/hybrid-model.ts; results are plain maps that the JS side parses with Zod.
class HybridAiModule : Module() {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  private val models = HashMap<String, GenerativeModel>()
  private var appCheckReady = false
  @Volatile private var downloading = false
  @Volatile private var lastDownloadError: String? = null
  @Volatile private var bytesTotal = 0L
  @Volatile private var bytesDone = 0L

  override fun definition() = ModuleDefinition {
    Name("HybridAi")

    AsyncFunction("status") Coroutine { timeoutMs: Double ->
      bounded(timeoutMs) { statusInfo() }
    }

    // The download can take minutes, so it runs in the background and this returns the current status.
    AsyncFunction("download") Coroutine { timeoutMs: Double ->
      bounded(timeoutMs) {
        if (!downloading && FirebaseAIOnDevice.checkStatus() == OnDeviceModelStatus.DOWNLOADABLE) startDownload()
        statusInfo()
      }
    }

    AsyncFunction("warmUp") Coroutine { timeoutMs: Double ->
      bounded(timeoutMs) {
        if (FirebaseAIOnDevice.checkStatus() == OnDeviceModelStatus.AVAILABLE) {
          model(InferenceMode.ONLY_ON_DEVICE, null, null).onDeviceExtension?.warmUp()
        }
        Unit
      }
    }

    AsyncFunction("generate") Coroutine { request: Map<String, Any?>, timeoutMs: Double ->
      bounded(timeoutMs) { generate(request) }
    }

    OnDestroy { scope.cancel() }
  }

  private suspend fun <T> bounded(timeoutMs: Double, block: suspend () -> T): T {
    val ms = timeoutMs.toLong().coerceIn(1L, MAX_TIMEOUT_MS)
    try {
      return withTimeout(ms) { block() }
    } catch (e: TimeoutCancellationException) {
      throw HybridAiException("ERR_TIMEOUT", "The AI call took longer than ${ms}ms.", e)
    }
  }

  private suspend fun statusInfo(): Map<String, Any?> {
    val status = try {
      FirebaseAIOnDevice.checkStatus()
    } catch (e: Exception) {
      return mapOf("status" to "unavailable", "reason" to "Gemini Nano isn't supported on this phone.")
    }
    val name = when (status) {
      OnDeviceModelStatus.AVAILABLE -> "available"
      OnDeviceModelStatus.DOWNLOADING -> "downloading"
      OnDeviceModelStatus.DOWNLOADABLE -> if (downloading) "downloading" else "downloadable"
      else -> "unavailable"
    }
    val reason = when {
      name == "unavailable" -> "Gemini Nano isn't available on this phone."
      name == "downloadable" && lastDownloadError != null -> "The last download failed: $lastDownloadError"
      name == "downloadable" -> "Gemini Nano needs a one-time download."
      name == "downloading" -> "Gemini Nano is downloading."
      else -> null
    }
    return buildMap {
      put("status", name)
      if (name == "available") put("modelName", "gemini-nano")
      // Byte counts only exist for a download this app started; otherwise the UI shows an indeterminate bar.
      if (name == "downloading" && bytesTotal > 0) put("progress", (bytesDone.toDouble() / bytesTotal).coerceIn(0.0, 1.0))
      if (reason != null) put("reason", reason)
    }
  }

  private fun startDownload() {
    downloading = true
    lastDownloadError = null
    bytesTotal = 0L
    bytesDone = 0L
    scope.launch {
      try {
        FirebaseAIOnDevice.download().collect { step ->
          when (step) {
            is DownloadStatus.DownloadStarted -> bytesTotal = step.bytesToDownload
            is DownloadStatus.DownloadInProgress -> bytesDone = step.totalBytesDownloaded
            is DownloadStatus.DownloadFailed -> lastDownloadError = "the phone couldn't finish it"
            else -> Unit
          }
        }
      } catch (e: Exception) {
        lastDownloadError = e.message?.take(120) ?: "unknown error"
      } finally {
        downloading = false
      }
    }
  }

  private suspend fun generate(request: Map<String, Any?>): Map<String, Any?> {
    val prompt = request["prompt"] as? String ?: throw HybridAiException("ERR_BAD_REQUEST", "Missing prompt.")
    val mode = parseMode(request["mode"] as? String)
    val system = request["systemInstruction"] as? String
    @Suppress("UNCHECKED_CAST")
    val schema = request["responseSchema"] as? Map<String, Any?>
    @Suppress("UNCHECKED_CAST")
    val audio = request["audio"] as? Map<String, Any?>
    // On-device models don't take audio, so a voice reply always goes to the cloud.
    val effectiveMode = if (audio != null) InferenceMode.ONLY_IN_CLOUD else mode

    val input = content {
      text(prompt)
      if (audio != null) {
        val mime = audio["mimeType"] as? String ?: throw HybridAiException("ERR_BAD_REQUEST", "Missing audio mimeType.")
        val data = audio["data"] as? String ?: throw HybridAiException("ERR_BAD_REQUEST", "Missing audio data.")
        inlineData(Base64.decode(data, Base64.NO_WRAP), mime)
      }
    }

    val started = SystemClock.elapsedRealtime()
    val response = try {
      model(effectiveMode, system, schema).generateContent(input)
    } catch (e: CodedException) {
      throw e
    } catch (e: Exception) {
      throw HybridAiException("ERR_GENERATE", e.message?.take(200) ?: "The AI call failed.", e)
    }
    val text = response.text ?: throw HybridAiException("ERR_EMPTY", "The model returned no text.")
    return mapOf(
      "text" to text,
      "inferenceSource" to if (response.inferenceSource == InferenceSource.ON_DEVICE) "on_device" else "in_cloud",
      "latencyMs" to (SystemClock.elapsedRealtime() - started).toDouble(),
    )
  }

  // The config is fixed when a model is created, so keep one per (mode, system prompt, schema).
  @Synchronized
  private fun model(mode: InferenceMode, system: String?, schema: Map<String, Any?>?): GenerativeModel {
    val key = "$mode|${system.hashCode()}|${schema.hashCode()}"
    return models.getOrPut(key) {
      val context = appContext.reactContext ?: throw notConfigured()
      if (FirebaseApp.getApps(context).isEmpty()) throw notConfigured()
      ensureAppCheck()
      // Gemini Nano only takes @Generable schemas, so modes that may run on device ask for the JSON in words
      // (the JS side validates it with Zod); cloud-only calls get the strict schema.
      val cloudOnly = mode == InferenceMode.ONLY_IN_CLOUD
      val instructions = listOfNotNull(system, schema?.takeUnless { cloudOnly }?.let(::schemaInstruction)).joinToString("\n\n")
      Firebase.ai(backend = GenerativeBackend.googleAI()).generativeModel(
        modelName = CLOUD_MODEL,
        generationConfig = schema?.takeIf { cloudOnly }?.let {
          generationConfig {
            responseMimeType = "application/json"
            responseJsonSchema = toJsonSchema(it)
          }
        },
        systemInstruction = instructions.takeIf { it.isNotEmpty() }?.let { content { text(it) } },
        onDeviceConfig = OnDeviceConfig(mode),
      )
    }
  }

  // Debug builds use App Check's debug provider: register the token it logs in the Firebase console.
  // Sideloaded test builds can't pass Play Integrity, so they carry a pre-registered token (plugins/with-app-check-debug-token.js),
  // seeded where the debug provider stores its secret.
  private fun ensureAppCheck() {
    if (appCheckReady) return
    val context = appContext.reactContext ?: return
    val debuggable = (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    val token = bakedDebugToken(context)
    if (token == null && !debuggable) return
    if (token != null) {
      val prefs = String.format(DEBUG_STORE_TEMPLATE, FirebaseApp.getInstance().persistenceKey)
      context.getSharedPreferences(prefs, Context.MODE_PRIVATE).edit().putString(DEBUG_SECRET_KEY, token).commit()
    }
    FirebaseAppCheck.getInstance().installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance())
    appCheckReady = true
  }

  private fun schemaInstruction(schema: Map<String, Any?>): String =
    "Reply with only one JSON object, no markdown, that matches this JSON schema:\n${JSONObject(schema)}"

  private fun bakedDebugToken(context: Context): String? {
    val info = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
    return info.metaData?.getString(DEBUG_TOKEN_META_KEY)?.takeIf { it.isNotBlank() }
  }

  private fun notConfigured() =
    HybridAiException("ERR_NOT_CONFIGURED", "Firebase isn't set up in this build: add google-services.json and rebuild.")

  private fun parseMode(value: String?): InferenceMode = when (value) {
    "only_on_device" -> InferenceMode.ONLY_ON_DEVICE
    "prefer_in_cloud" -> InferenceMode.PREFER_IN_CLOUD
    "only_in_cloud" -> InferenceMode.ONLY_IN_CLOUD
    else -> InferenceMode.PREFER_ON_DEVICE
  }
}
