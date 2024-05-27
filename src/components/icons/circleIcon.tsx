/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { FC, ReactNode } from 'react';
import { Box, useTheme } from '@mui/material';

interface CircleIconProps {
    size: number;
    iconStyles?: (theme: any) => React.CSSProperties; // Adjust this type based on your theme type
    children: ReactNode;
}

const CircleIcon: FC<CircleIconProps> = ({ size, iconStyles, children }) => {
    const theme = useTheme();
    const circleStyles: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(iconStyles && iconStyles(theme)),
    };

    return <Box sx={circleStyles}>{children}</Box>;
};

export default CircleIcon;
