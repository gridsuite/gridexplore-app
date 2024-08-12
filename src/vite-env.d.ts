/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

/* Don't know why but seem that TypeScript merge definitions of these two interfaces with existing ones.
 * https://vitejs.dev/guide/env-and-mode#intellisense-for-typescript
 */
import { UrlString } from '@gridsuite/commons-ui';

interface ImportMetaEnv {
    /* From @gridsuite/commons-ui */
    readonly VITE_API_GATEWAY: UrlString;
    readonly VITE_WS_GATEWAY: UrlString;
    // readonly VITE_DEBUG_REQUESTS?: boolean;
    readonly VITE_DEBUG_HOOK_RENDER?: boolean;
    /* From this app */
    readonly VITE_DEBUG_REQUESTS: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
