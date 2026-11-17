Pod::Spec.new do |s|
  s.name           = 'HybridAi'
  s.version        = '0.1.0'
  s.summary        = 'SceneSpeak on-device AI bridge'
  s.description    = 'Firebase AI Logic hybrid inference for SceneSpeak'
  s.license        = 'AGPL-3.0-only'
  s.author         = 'SceneSpeak'
  s.homepage       = 'https://github.com/Xlient/SceneSpeak'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
