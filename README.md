# GridExplore-App

[![MPL-2.0 License](https://img.shields.io/badge/license-MPL_2.0-blue.svg)](https://www.mozilla.org/en-US/MPL/2.0/)

## Description

The **gridexplore-app** is the file/directory management front-end of the [GridSuite](https://github.com/gridsuite) platform. It is the UI consumed by users on top of the [`explore-server`](https://github.com/gridsuite/explore-server) microservice, and provides:

- **Directory tree navigation**: browse, create, rename, move and delete directories and root directories.
- **Element management**: create, duplicate, rename, move and delete elements (studies, cases, contingency lists, filters, parameter sets, spreadsheet configurations, etc.) stored in the directory tree.
- **Study and case creation**: create new studies from existing cases, or import new cases.
- **Spreadsheet configurations**: create and manage spreadsheet config collections and workspaces used by the spreadsheet view of GridStudy.
- **Sharing and permissions**: manage access rights on directories and elements between users.

This app uses the [commons-ui](https://github.com/gridsuite/commons-ui) library which is released on npmjs.

## Technical Stack

- React + TypeScript, built with Vite
- Redux Toolkit (RTK) for state management
- MUI (Material UI) for the component library
- ag-grid / TanStack Table for tabular data
- react-hook-form + yup for forms and validation
- react-intl for i18n
- Jest for unit tests

## Interactions with Other Services

```
┌──────────────────┐
│ gridexplore-app  │──► explore-server            (directories, elements, studies, cases)
│                  │──► study-config-server        (spreadsheet config collections, workspaces)
│                  │──► user-admin-server          (users identities, current announcement)
│                  │──► monitor-server             (fetch process config)
│                  │
│                  │◄── config-notification (websocket)           (user config changes)
│                  │◄── config-notification/global (websocket)    (system-wide announcements, via commons-ui)
│                  │◄── directory-notification (websocket)         (directory/element changes → tree auto-refresh)
└──────────────────┘
```

## Getting started

To launch the app type `npm install` then `npm start`.

##### Development Scripts

- **`npm run type-check`** - Runs TypeScript type checking without emitting files. This ensures all developers use the project's local TypeScript version from `node_modules` rather than a potentially different globally-installed version. Run this to verify your code has no type errors before committing.

- **`npm run build`** - Builds the app. Note: This automatically runs `npm run prebuild` first.

- **`npm run prebuild`** - Runs linting and type checking before the build. This script is executed automatically by npm before `npm run build` and ensures that the build is not executed if linting or type checking fails. You don't need to call this manually unless you want to verify code quality without building.

## Front-End Architecture

The code under `src` is organised as follows:

- **`components/`** - UI building blocks: `dialogs` (creation/edit/move dialogs for elements), `menus` and `toolbars` (contextual actions), `search`, `icons` and `utils`.
- **`redux/`** - Global application state managed with [`redux-toolkit`](https://redux-toolkit.js.org/) (RTK): slices, selectors and reducers shared across the app.
- **`hooks/`** - Reusable React hooks.
- **`plugins/`** - Extension points, including `translations` for plugin-provided i18n messages.
- **`translations/`** - i18n message files (`react-intl`), including `external` and `not-intl` resources.
- **`utils/`** - Generic, reusable helper functions, including `rest-api.ts` for all backend REST calls.
- **`images/`** - Static assets (logos, icons).
- **`_mocks_/`** - Mocks used by unit tests.

If you are a developer and you want to update/enhance components used from the gridsuite commons-ui library,
click [here](https://github.com/gridsuite/commons-ui) and follow instructions.

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Typescript config

Files `tsconfig.json` and `src/react-app-env.d.ts` both result from the create-react-app typescript template (version 5).
Some property values have been changed to meet the project needs (ex: target, baseUrl, ...).

## License Headers and dependencies checking

To check dependencies license compatibility with this project locally, please run the following command:

```
npm run licenses-check
```

Notes:

- Check [license-checker-config.json](license-checker-config.json) for the license white list.
  If you need to update this list, please inform the organization's owners.
