// https://github.com/emotion-js/emotion/discussions/2291
//   https://emotion.sh/docs/typescript#define-a-theme

import { Theme as EmotionTheme } from '@emotion/react';
import { Theme as MaterialUITheme } from '@mui/material';

//import '@emotion/react';
declare module '@emotion/react' {
    // Re-declare the emotion theme to have the properties of the MaterialUiTheme
    export interface Theme extends EmotionTheme, MaterialUITheme {}
}
