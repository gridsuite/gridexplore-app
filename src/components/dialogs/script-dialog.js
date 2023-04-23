/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import makeStyles from '@mui/styles/makeStyles';
import { saveFilter, saveScriptContingencyList } from '../../utils/rest-api';
import { ElementType, FilterType } from '../../utils/elementType';
import ScriptDialogContent from './script-dialog-content';

const useStyles = makeStyles(() => ({
    dialogPaper: {
        minWidth: '700px',
        minHeight: '500px',
        margin: 'auto',
    },
}));

/**
 * Dialog to edit a script contingency list
 * @param id id of list to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onError handle errors
 * @param title Title of the dialog
 * @param type Contingencies or filter
 * @param subtype Element's subtype
 */
const ScriptDialog = ({
    id,
    open,
    onClose,
    onError,
    title,
    type,
    isCreation,
}) => {
    const classes = useStyles();
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const [currentScript, setCurrentScript] = useState(null);
    const [nameValue, setNameValue] = useState('');

    const handleClose = () => {
        handleCancel();
    };

    const handleCancel = () => {
        onClose();
    };

    const handleClick = () => {
        let newScript;
        if (type === ElementType.CONTINGENCY_LIST) {
            newScript = {
                id: id,
                script: currentScript ?? '',
                name: nameValue ?? '',
            };
            saveScriptContingencyList(newScript)
                .then(() => {})
                .catch((error) => {
                    onError(error.message);
                });
        } else {
            newScript = {
                id: id,
                script: currentScript ?? '',
                type: FilterType.SCRIPT,
            };
            saveFilter(newScript)
                .then(() => {})
                .catch((error) => {
                    onError(error.message);
                });
        }
        setBtnSaveListDisabled(true);
        onClose();
        setCurrentScript(newScript);
    };

    const onChangeHandler = (newValue, isScript) => {
        if (isScript) {
            setBtnSaveListDisabled(newValue === currentScript);
            setCurrentScript(newValue);
        } else {
            setNameValue(newValue);
            setBtnSaveListDisabled(newValue === nameValue);
        }
    };

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-script-contingency-edit"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <div>
                    <ScriptDialogContent
                        id={id}
                        onChange={onChangeHandler}
                        onError={onError}
                        type={type}
                        isCreation={isCreation}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    disabled={btnSaveListDisabled}
                    onClick={handleClick}
                    variant="outlined"
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ScriptDialog.propTypes = {
    id: PropTypes.string,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    isCreation: PropTypes.bool,
};

export default ScriptDialog;
