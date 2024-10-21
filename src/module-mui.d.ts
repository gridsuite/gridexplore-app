/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/* eslint-disable spaced-comment */

// https://mui.com/material-ui/customization/theming/#typescript
// eslint-disable-next-line import/no-extraneous-dependencies -- lib from MUI
import { CSSObject } from '@mui/styled-engine';
import type { Property } from 'csstype';
// import { Theme as MuiTheme, ThemeOptions as MuiThemeOptions } from '@mui/material/styles/createTheme';

declare module '@mui/material/styles' {
    type ThemeExtension = {
        arrow: CSSObject;
        arrow_hover: CSSObject;
        circle: CSSObject;
        circle_hover: CSSObject;
        link: CSSObject;
        row: CSSObject;
        aggrid: {
            theme: 'ag-theme-alpine' | 'ag-theme-alpine-dark';
            highlightColor: Property.Color;
        };
        agGridBackground: CSSObject;
    };

    export interface Theme extends /*MuiTheme,*/ ThemeExtension {}

    // allow configuration using `createTheme`
    export interface ThemeOptions extends /*MuiThemeOptions,*/ Partial<ThemeExtension> {}
}

declare module '@mui/utils/capitalize' {
    export default function capitalize<S extends string>(string: S): Capitalize<S>;
}
