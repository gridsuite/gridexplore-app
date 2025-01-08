/*
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useMemo } from 'react';
import { Box, type BoxProps } from '@mui/material';
import { mergeSx, type MuiStyle } from '@gridsuite/commons-ui';

export type RoundBoxProps = { size: number } & BoxProps;

export default function RoundBox({ size, sx, ...props }: Readonly<RoundBoxProps>) {
    const boxStyles = useMemo<MuiStyle>(
        () =>
            mergeSx(
                {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                sx
            ),
        [sx, size]
    );

    return <Box sx={boxStyles} {...props} />;
}
