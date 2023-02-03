// directoryContentMenuPlugins imports
import CreateStudyMenuItem from './directoryContentMenuItemPlugins/createStudyMenuItem';

// treeViewContainerPlugins imports
import AlertButton from './treeViewContainerPlugins/alertButton';

// Exports
// Warning : Keep the following exported arrays emptied to manage no plugins
// implementations otherwise those module imports will fail in the base code
// of this project.
export const DirectoryContentMenuItemPlugins = [CreateStudyMenuItem];

export const TreeViewContainerPlugins = [AlertButton];
