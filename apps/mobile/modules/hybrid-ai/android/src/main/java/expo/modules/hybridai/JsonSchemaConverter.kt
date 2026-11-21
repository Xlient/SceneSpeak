package expo.modules.hybridai

import com.google.firebase.ai.type.JsonSchema

// Builds the SDK's JsonSchema from the plain JSON schema the shared core already sends to the web SDK,
// so Android needs no per-schema @Generable classes. Unsupported keywords are ignored.
internal fun toJsonSchema(node: Map<String, Any?>): JsonSchema<*> {
  val description = node["description"] as? String
  val title = node["title"] as? String
  val nullable = node["nullable"] as? Boolean ?: false
  @Suppress("UNCHECKED_CAST")
  val enumValues = (node["enum"] as? List<Any?>)?.mapNotNull { it as? String }
  if (!enumValues.isNullOrEmpty()) return JsonSchema.enumeration(enumValues, description, nullable, title)

  return when (node["type"] as? String) {
    "object" -> {
      @Suppress("UNCHECKED_CAST")
      val props = (node["properties"] as? Map<String, Any?>).orEmpty()
        .mapNotNull { (key, value) -> (value as? Map<String, Any?>)?.let { key to toJsonSchema(it) } }
        .toMap()
      val required = (node["required"] as? List<*>)?.mapNotNull { it as? String }?.toSet() ?: emptySet()
      JsonSchema.obj(props, props.keys.filterNot { it in required }, description, nullable, title)
    }
    "array" -> {
      @Suppress("UNCHECKED_CAST")
      val items = (node["items"] as? Map<String, Any?>)?.let { toJsonSchema(it) } ?: JsonSchema.string()
      JsonSchema.array(items, description, nullable, title, number(node["minItems"])?.toInt(), number(node["maxItems"])?.toInt())
    }
    "integer" -> JsonSchema.integer(description, nullable, title, number(node["minimum"]), number(node["maximum"]))
    "number" -> JsonSchema.double(description, nullable, title, number(node["minimum"]), number(node["maximum"]))
    "boolean" -> JsonSchema.boolean(description, nullable, title)
    else -> JsonSchema.string(description, nullable, null, title)
  }
}

private fun number(value: Any?): Double? = (value as? Number)?.toDouble()
