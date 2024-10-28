/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useController } from 'react-hook-form';
import AceEditor, { IAceEditorProps, IEditorProps } from 'react-ace';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '../../../redux/types';
import 'ace-builds/src-noconflict/mode-groovy';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-clouds_midnight';

export interface AceInputProps {
    name: string;
    placeholder: string;
    fontSize: Exclude<IAceEditorProps['fontSize'], undefined>;
    height: Exclude<IAceEditorProps['height'], undefined>;
    editorProps: IEditorProps;
}

export default function AceInput({ name, ...props }: Readonly<AceInputProps>) {
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
}
