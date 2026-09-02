# Local `jekyll serve` only. GitHub Pages ignores custom plugins.
if defined?(WEBrick::HTTPUtils::DefaultMimeTypes)
  WEBrick::HTTPUtils::DefaultMimeTypes['glb'] = 'model/gltf-binary'
  WEBrick::HTTPUtils::DefaultMimeTypes['js'] ||= 'application/javascript'
end
