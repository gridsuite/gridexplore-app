/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Property } from 'csstype';

// Just to be sure that commons-ui's mui augmentation is seen by tsc
import type {} from '@gridsuite/commons-ui';

// https://mui.com/material-ui/customization/theming/#typescript
declare module '@mui/material/styles' {
    interface Theme {
        link: {
            color: Property.Color;
        };
        row: {
            primary: Property.BackgroundColor;
            hover: Property.BackgroundColor;
        };
    }

    // allow configuration using `createTheme`
    interface ThemeOptions {
        // note: options aren't optional because there aren't default values in code
        link: {
            color: Property.Color;
        };
        row: {
            primary: Property.BackgroundColor;
            hover: Property.BackgroundColor;
        };
    }
}
