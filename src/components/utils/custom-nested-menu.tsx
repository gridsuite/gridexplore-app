/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { PropsWithChildren, useState } from 'react';
import { NestedMenuItem, NestedMenuItemProps } from 'mui-nested-menu';
import { Box, SxProps, Theme } from '@mui/material';
import { mergeSx } from '@gridsuite/commons-ui';

const styles = {
    highlightedParentLine: {
        backgroundColor: 'action.hover',
        color: 'primary.main',
        transition: 'all 300ms ease',
    },
    highlightedLine: {
        transition: 'all 300ms ease',
        '&:hover': {
            backgroundColor: 'action.hover',
            color: 'primary.main',
        },
    },
    label: {
        '.MuiMenuItem-root, .MuiTypography-root': {
            paddingLeft: '4px',
        },
        paddingLeft: 2,
    },
};

interface CustomNestedMenuItemProps extends PropsWithChildren, Omit<NestedMenuItemProps, 'parentMenuOpen'> {
    sx?: SxProps<Theme>;
}

export function CustomNestedMenuItem({ sx, children, ...other }: Readonly<CustomNestedMenuItemProps>) {
    const [isSubMenuActive, setSubMenuActive] = useState(false);

    return (
        <NestedMenuItem
            {...other}
            parentMenuOpen
            sx={mergeSx(isSubMenuActive ? styles.highlightedParentLine : styles.highlightedLine, styles.label, sx)}
        >
            <Box onMouseEnter={() => setSubMenuActive(true)} onMouseLeave={() => setSubMenuActive(false)}>
                {children}
            </Box>
        </NestedMenuItem>
    );
}
