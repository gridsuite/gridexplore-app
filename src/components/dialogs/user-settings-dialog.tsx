/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState, SyntheticEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Alert, Dialog, Grid, Switch, Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { PARAM_DEVELOPER_MODE } from '../../utils/config-params';
import { CancelButton } from '@gridsuite/commons-ui';
import { useDispatch } from 'react-redux';
import { selectEnableDeveloperMode } from '../../redux/actions';
import {useParameterState} from "./use-parameters-dialog";

export interface UserSettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Dialog to display user settings
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 */
export default function UserSettingsDialog({ open, onClose }: Readonly<UserSettingsDialogProps>) {
    const dispatch = useDispatch();

    const [enableDeveloperMode, handleChangeEnableDeveloperModeLocal] = useParameterState(PARAM_DEVELOPER_MODE);

    //const enableDeveloperMode = useSelector((state: AppState) => state[PARAM_DEVELOPER_MODE]);
    const [developerMode, setDeveloperMode] = useState(enableDeveloperMode);

    const handleValidate = () => {
        dispatch(selectEnableDeveloperMode(developerMode));
        handleChangeEnableDeveloperModeLocal(developerMode);
        onClose();
    };

    const handleClose = (_: SyntheticEvent, reason?: string) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose();
    };

    return (
        <Dialog fullWidth open={open} onClose={handleClose}>
            <DialogTitle>
                <FormattedMessage id="UserSettings" />
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Grid item xs={8} sx={{}}>
                            <FormattedMessage id="EnableDeveloperMode" />
                        </Grid>
                        <Grid item container xs={4} sx={{}}>
                            <Switch
                                checked={developerMode}
                                onChange={(_event, isChecked) => setDeveloperMode(isChecked)}
                                value={developerMode}
                                inputProps={{ 'aria-label': 'primary checkbox' }}
                            />
                        </Grid>
                        {developerMode && (
                            <Alert severity={'warning'}>
                                <FormattedMessage id="DeveloperModeWarningMsg" />
                            </Alert>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} />
                <Button onClick={handleValidate} disabled={false} variant="outlined">
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}
