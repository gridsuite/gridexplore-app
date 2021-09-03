/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-groovy';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds_midnight';

import { makeStyles } from '@material-ui/core/styles';
import {
    getContingencyList,
    saveScriptContingencyList,
} from '../../utils/rest-api';
import { ScriptTypes } from '../../utils/script-types';

const useStyles = makeStyles(() => ({
    dialogPaper: {
        minWidth: '700px',
        minHeight: '500px',
        margin: 'auto',
    },
    aceEditor: {
        minWidth: '650px',
        minHeight: '450px',
        marginTop: '4px',
        //borderLeft: '1px solid #ccc',
        flexGrow: 1,
    },
}));

/**
 * Dialog to edit a script contingency list
 * @param listId id of list to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onError handle errors
 * @param title Title of the dialog
 */
const ScriptContingencyDialog = ({ listId, open, onClose, onError, title }) => {
    const classes = useStyles();
    const selectedTheme = useSelector((state) => state.theme);
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const [aceEditorContent, setAceEditorContent] = useState('');
    const [currentScriptContingency, setCurrentScriptContingency] = useState(
        null
    );
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    /**
     * Set name of for the Ace Editor : if theme is light set "github theme" else set "clouds_midnight theme"
     * */
    let themeForAceEditor = () => {
        return selectedTheme === 'Light'
            ? 'github'
            : selectedTheme === 'Dark'
            ? 'clouds_midnight'
            : '';
    };

    const handleClose = () => {
        handleCancel();
    };

    const handleCancel = () => {
        setAceEditorContent(currentScriptContingency.script);
        setBtnSaveListDisabled(true);
        onClose();
    };

    const handleClick = () => {
        let newScriptContingencyList = {
            id: listId,
            name: name,
            description: description,
            script: aceEditorContent,
        };
        saveScriptContingencyList(newScriptContingencyList)
            .then((response) => {})
            .catch((error) => {
                onError(error.message);
            });
        onClose();
        setCurrentScriptContingency(newScriptContingencyList);
    };

    const onChangeAceEditor = (newScript) => {
        setAceEditorContent(newScript);
        if (
            currentScriptContingency !== null &&
            newScript !== currentScriptContingency.script
        ) {
            setBtnSaveListDisabled(false);
        } else {
            setBtnSaveListDisabled(true);
        }
    };

    const getCurrentContingencyList = useCallback(
        (currentItemId) => {
            getContingencyList(ScriptTypes.SCRIPT, currentItemId)
                .then((data) => {
                    if (data) {
                        setCurrentScriptContingency(data);
                        setAceEditorContent(data.script);
                        setName(data.name);
                        setDescription(data.description);
                    }
                })
                .catch((error) => {
                    onError(error.message);
                });
        },
        [onError]
    );

    useEffect(() => {
        // get contingency list
        getCurrentContingencyList(listId);
    }, [listId, getCurrentContingencyList]);

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
                    <AceEditor
                        className={classes.aceEditor}
                        mode="groovy"
                        placeholder="Insert your groovy script here"
                        theme={themeForAceEditor()}
                        onChange={(val) => onChangeAceEditor(val)}
                        value={aceEditorContent}
                        fontSize="18px"
                        editorProps={{ $blockScrolling: true }}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    disabled={btnSaveListDisabled}
                    onClick={handleClick}
                    variant="outlined"
                >
                    <FormattedMessage id="save" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ScriptContingencyDialog.propTypes = {
    listId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default ScriptContingencyDialog;
