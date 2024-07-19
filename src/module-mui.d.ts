// https://mui.com/material-ui/customization/theming/#typescript
import { CSSObject } from '@mui/styled-engine';
import {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles/createTheme';

declare module '@mui/material/styles/createTheme' {
    export * from '@mui/material/styles/createTheme';

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
    export interface Theme extends MuiTheme, ThemeExtension {}
    // allow configuration using `createTheme`
    export interface ThemeOptions
        extends MuiThemeOptions,
            Partial<ThemeExtension> {}
}

declare module '@mui/utils/capitalize' {
    export default function capitalize<S extends string>(
        string: S
    ): Capitalize<S>;
}
