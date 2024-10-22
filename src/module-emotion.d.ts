/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/* eslint-disable spaced-comment */

// https://github.com/emotion-js/emotion/discussions/2291
//   https://emotion.sh/docs/typescript#define-a-theme

// import { Theme as EmotionTheme } from '@emotion/react';
import { Theme as MaterialUITheme } from '@mui/material';

declare module '@emotion/react' {
    // Re-declare the emotion theme to have the properties of the MaterialUiTheme
    export interface Theme extends /*EmotionTheme,*/ MaterialUITheme {}
}
