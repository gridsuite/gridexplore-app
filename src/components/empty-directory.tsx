/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { type MouseEvent } from 'react';
import { Box, Button, SvgIcon } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { FormattedMessage } from 'react-intl';
import { LIGHT_THEME } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { PARAM_THEME } from 'utils/config-params';
import { AppState } from '../redux/types';
import CircleIcon from './icons/circleIcon';

const CIRCLE_SIZE = 250;

const styles = {
    container: (theme: any) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.spacing(20),
    }),
    button: (theme: any) => ({
        marginTop: theme.spacing(2),
        borderRadius: '30px',
    }),
    iconSize: {
        fontSize: CIRCLE_SIZE / 2,
    },
    circle: (theme: any) => ({
        backgroundColor: theme.palette.action.disabled,
    }),
    text: (theme: any) => ({
        color: theme.palette.text.disabled,
        textAlign: 'center',
        marginTop: theme.spacing(1),
    }),
};

export type EmptyDirectoryProps = {
    onCreateElementButtonClick: (e: MouseEvent<HTMLElement>) => void;
};

export default function EmptyDirectory({ onCreateElementButtonClick }: Readonly<EmptyDirectoryProps>) {
    const theme = useSelector((state: AppState) => state[PARAM_THEME]);
    return (
        <Box sx={styles.container}>
            <CircleIcon size={CIRCLE_SIZE} iconStyles={styles.circle}>
                <SvgIcon sx={styles.iconSize}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill={theme === LIGHT_THEME ? undefined : '#e8eaed'}
                    >
                        <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z" />
                    </svg>
                </SvgIcon>
            </CircleIcon>
            <Box sx={styles.text}>
                <h3>
                    <FormattedMessage id="emptyDirContent" />
                </h3>
                <Button
                    variant="contained"
                    sx={styles.button}
                    onClick={onCreateElementButtonClick}
                    endIcon={<AddIcon />}
                    data-testid="AddElementInEmptyDirectoryButton"
                >
                    <FormattedMessage id="createElement" />
                </Button>
            </Box>
        </Box>
    );
}
