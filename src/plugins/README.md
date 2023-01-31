# How to add plugins

* Add a plugin component or object in the corresponding group represented as folders.

MyNewPlugin.js
```js
const MyNewPlugin = {
    ...
};

export default MyNewPlugin;
```

* Edit index.js to export your new plugin in the corresponding group
```js
import MyNewPlugin from './directoryContentMenuItem/MyNewPlugin'
...
export const DirectoryContentMenuItemPlugins = [MyNewPlugin];
```

Currently supported Plugin groups :

* DirectoryContentMenuItem Plugins
* TreeView Plugins

