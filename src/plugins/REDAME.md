# Plugins Documentation

# How to tests

Remove or add the plugins folder should make the app works with or without plugins


## It's already ok
A Plugin could be an object
A Plugin could be a Component
A plugin could use a translation, "Message Descriptor ID", from code base.
A Plugin could have a proper translation in plugins/translation/en or fr.json
Multiple plugin components could be define in a group, for a specific usage (a proper API will be needed)
A Plugin could return a statement in the code base, then execute an action from the code base. Must be define by Plugin Group API.


## TODO

* Lazy load all the Plugins without naming it. For now dynamic import in a React Lazy should return a Promise over a default exported Component not an array... 
  It already works with one default component but it's a pain if we must parametrize names in path for dynamic imports loop?
  (Must Use an errorBoundary to fallback when the module is not found)

