/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/* eslint-disable spaced-comment */

// https://mui.com/material-ui/customization/theming/#typescript
import type { PartialDeep } from 'type-fest';
import type { Property } from 'csstype';

declare module '@mui/material/styles' {
    type ThemeExtension = {
        link: {
            color: Property.Color;
        };
        row: {
            primary: Property.Color;
            hover: Property.Color;
        };
    };

    export interface Theme extends /*MuiTheme,*/ ThemeExtension {}

    // allow configuration using `createTheme`
    export interface ThemeOptions extends /*MuiThemeOptions,*/ PartialDeep<ThemeExtension> {}
}
