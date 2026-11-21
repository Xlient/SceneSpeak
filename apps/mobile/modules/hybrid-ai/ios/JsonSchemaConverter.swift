import FirebaseAILogic

// Builds the SDK's Schema from the plain JSON schema the shared core already sends to the web SDK,
// so iOS needs no per-schema types. Unsupported keywords are ignored.
func toSchema(_ node: [String: Any]) -> Schema {
  let description = node["description"] as? String
  let title = node["title"] as? String
  let nullable = node["nullable"] as? Bool ?? false
  if let values = (node["enum"] as? [Any])?.compactMap({ $0 as? String }), !values.isEmpty {
    return .enumeration(values: values, description: description, title: title, nullable: nullable)
  }

  switch node["type"] as? String {
  case "object":
    let props = (node["properties"] as? [String: Any] ?? [:]).compactMapValues { ($0 as? [String: Any]).map(toSchema) }
    let required = Set((node["required"] as? [Any] ?? []).compactMap { $0 as? String })
    return .object(properties: props, optionalProperties: props.keys.filter { !required.contains($0) },
                   description: description, title: title, nullable: nullable)
  case "array":
    let items = (node["items"] as? [String: Any]).map(toSchema) ?? .string()
    return .array(items: items, description: description, title: title, nullable: nullable,
                  minItems: int(node["minItems"]), maxItems: int(node["maxItems"]))
  case "integer":
    return .integer(description: description, title: title, nullable: nullable,
                    minimum: int(node["minimum"]), maximum: int(node["maximum"]))
  case "number":
    return .double(description: description, title: title, nullable: nullable,
                   minimum: (node["minimum"] as? NSNumber)?.doubleValue, maximum: (node["maximum"] as? NSNumber)?.doubleValue)
  case "boolean":
    return .boolean(description: description, title: title, nullable: nullable)
  default:
    return .string(description: description, title: title, nullable: nullable)
  }
}

private func int(_ value: Any?) -> Int? { (value as? NSNumber)?.intValue }
