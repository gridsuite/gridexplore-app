# Private library of plugin components

## How to tests

Remove or add the privateComponentLibrary dependency in package.json
It should make the app works with or without external plugins from privateComponentLibrary

in this folder
```bash
    npm run build
```
then in root folder of gridExplore-app

package.json
```json
{
    ...
    "dependencies":
        ...
        "privatecomponentlibrary": "file:./privateComponentLibrary"
    ...
}
```

```bash
    rm -rf node_modules\
    npm install
    npm start
```

## It's already ok

* Make a plugin with its dependencies (with a proper package.json), then add this dependency in this project anonymously or at least for a group of plugins.

## TODO

* Lazy load all the Plugins without naming it. For now dynamic import in a React Lazy should return a Promise over a default exported Component not an array... 
  It already works with one default component but it's a pain if we must parametrize names in path for dynamic imports loop?
  (Must Use an errorBoundary to fallback when the module is not found)
