/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { Button, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import { FormattedMessage } from 'react-intl';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

const useStyles = makeStyles((theme: Theme) => ({
    advancedParameterButton: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
    },
}));

interface AdvancedParameterButtonProps {
    showOpenIcon: boolean;
    label: string;
    callback: () => void;
    disabled?: boolean;
}

const AdvancedParameterButton: React.FunctionComponent<
    AdvancedParameterButtonProps
> = ({ showOpenIcon, label, callback, disabled = false }) => {
    const classes = useStyles();

    return (
        <Grid item xs={12} className={classes.advancedParameterButton}>
            <Button
                startIcon={<SettingsIcon />}
                endIcon={
                    showOpenIcon && <CheckIcon style={{ color: 'green' }} />
                }
                onClick={callback}
                disabled={disabled}
            >
                <FormattedMessage id={label} />
            </Button>
        </Grid>
    );
};

export default AdvancedParameterButton;
