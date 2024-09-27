/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useController } from 'react-hook-form';
import AceEditor, { IAceEditorProps, IEditorProps } from 'react-ace';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import 'ace-builds/src-noconflict/mode-groovy';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import { AppState } from '../../../redux/reducer';

interface AceInputProps {
    name: string;
    placeholder: string;
    fontSize: Exclude<IAceEditorProps['fontSize'], undefined>;
    editorProps: IEditorProps;
}

const AceInput = ({ name, ...props }: AceInputProps) => {
    const selectedTheme = useSelector((state: AppState) => state.theme);
    const themeForAceEditor = useMemo(() => {
        switch (selectedTheme) {
            case 'Dark':
                return 'clouds_midnight';
            case 'Light':
                return 'github';
            default:
                return '';
        }
    }, [selectedTheme]);

    const {
        field: { onChange, value },
    } = useController({ name });

    return (
        <AceEditor mode="groovy" theme={themeForAceEditor} onChange={(val) => onChange(val)} value={value} {...props} />
    );
};

export default AceInput;
