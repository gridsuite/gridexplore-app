# Plugins Documentation

# How to tests

Remove or add the plugins folder should make the app works with or without plugins


## It's already ok
A Plugin could be an object
A Plugin could be a Component
A plugin could use a translation, "Message Descriptor ID", from code base.
A Plugin could have a proper translation in plugins/translation/en or fr.json
A Plugin could return a statement in the code base, then execute an action from the code base. Must be define by Plugin Group API.


## TODO

* Make multiple plugin components in a group, for a specific usage (a proper API will be needed), then lazy load all the Plugins without naming it. 
Use an errorBoundary to fallback when the module is not found.
* Make a plugin with its dependencies (with a proper package.json), then add this dependency in this project and lazy load the Plugin.
Use an errorBoundary to fallback when the module is not found.
