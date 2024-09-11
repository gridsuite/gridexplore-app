/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useController } from 'react-hook-form';
import AceEditor from 'react-ace';
import React from 'react';
import { useSelector } from 'react-redux';
import 'ace-builds/src-noconflict/mode-groovy';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds_midnight';
import { AppState } from '../../../redux/reducer';

interface AceInputProps {
    name: string;
    placeholder: string;
    fontSize: string;
    editorProps: Record<string, any>;
}

const AceInput = ({ name, ...props }: AceInputProps) => {
    const selectedTheme = useSelector((state: AppState) => state.theme);
    /**
     * Set name of for the Ace Editor : if theme is light set "github theme" else set "clouds_midnight theme"
     * */
    let themeForAceEditor = () => {
        return selectedTheme === 'Light' ? 'github' : selectedTheme === 'Dark' ? 'clouds_midnight' : '';
    };

    const {
        field: { onChange, value },
    } = useController({ name });

    return (
        <AceEditor
            mode="groovy"
            theme={themeForAceEditor()}
            onChange={(val) => onChange(val)}
            value={value}
            {...props}
        />
    );
};

export default AceInput;
