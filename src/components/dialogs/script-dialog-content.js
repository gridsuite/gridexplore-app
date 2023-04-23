/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-groovy';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import makeStyles from '@mui/styles/makeStyles';
import { getContingencyList, getFilterById } from '../../utils/rest-api';
import { ContingencyListType, ElementType } from '../../utils/elementType';
import NameComponent from './name-filter-or-contingency';

const useStyles = makeStyles(() => ({
    aceEditor: {
        minWidth: '650px',
        minHeight: '450px',
        marginTop: '4px',
        //borderLeft: '1px solid #ccc',
        flexGrow: 1,
    },
}));

const ScriptDialogContent = ({ id, onError, type, onChange, isCreation }) => {
    const classes = useStyles();
    const selectedTheme = useSelector((state) => state.theme);
    const [aceEditorContent, setAceEditorContent] = useState('');
    const [nameValue, setNameValue] = useState('');

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

    const handleNameChange = useCallback(
        (newName) => {
            setNameValue(newName);
            onChange(newName);
        },
        [setNameValue, onChange]
    );
    const onChangeAceEditor = useCallback(
        (newScript) => {
            setAceEditorContent(newScript);
            onChange(newScript, true);
        },
        [setAceEditorContent, onChange]
    );

    const getCurrentScript = useCallback(
        (currentItemId) => {
            if (currentItemId != null) {
                if (type === ElementType.CONTINGENCY_LIST) {
                    getContingencyList(
                        ContingencyListType.SCRIPT,
                        currentItemId
                    )
                        .then((data) => {
                            if (data) {
                                setAceEditorContent(data.script ?? '');
                                setNameValue(data.name ?? '');
                            }
                        })
                        .catch((error) => {
                            onError(error.message);
                        });
                } else if (type === ElementType.FILTER) {
                    getFilterById(currentItemId)
                        .then((data) => {
                            if (data) {
                                setAceEditorContent(data.script ?? '');
                            }
                        })
                        .catch((error) => {
                            onError(error.message);
                        });
                }
            }
        },
        [onError, type, setAceEditorContent]
    );

    useEffect(() => {
        // get contingency list
        getCurrentScript(id);
    }, [id, getCurrentScript]);

    return (
        <>
            {!isCreation && (
                <NameComponent
                    titleMessage={'Name'}
                    contentType={type}
                    initialValue={nameValue}
                    onChange={handleNameChange}
                />
            )}
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
        </>
    );
};

ScriptDialogContent.propTypes = {
    id: PropTypes.string,
    onError: PropTypes.func.isRequired,
    type: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    isCreation: PropTypes.bool,
};

export default ScriptDialogContent;
