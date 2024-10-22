/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CSSProperties, ReactNode } from 'react';
import { Box, useTheme } from '@mui/material';

export interface CircleIconProps {
    size: number;
    iconStyles?: (theme: any) => CSSProperties; // Adjust this type based on your theme type
    children: ReactNode;
}

export default function CircleIcon({ size, iconStyles, children }: Readonly<CircleIconProps>) {
    const theme = useTheme();
    const circleStyles: CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(iconStyles && iconStyles(theme)),
    };

    return <Box sx={circleStyles}>{children}</Box>;
}
