import { ValueEditorProps } from 'react-querybuilder';
import { useParameterState } from '../../dialogs/parameters-dialog';
import { PARAM_LANGUAGE } from '../../../utils/config-params';
import React, { useCallback, useMemo } from 'react';
import { getComputedLanguage } from '../../../utils/language';
import { FieldType } from '../../dialogs/filter/expert/expert-filter-constants';
import { MaterialValueEditor } from '@react-querybuilder/material';

const ValueEditor = (props: ValueEditorProps) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const countriesListCB = useCallback(() => {
        try {
            return require('localized-countries')(
                require('localized-countries/data/' +
                    getComputedLanguage(languageLocal).substr(0, 2))
            );
        } catch (error) {
            // fallback to english if no localised list found
            return require('localized-countries')(
                require('localized-countries/data/en')
            );
        }
    }, [languageLocal]);

    const countriesList = useMemo(() => countriesListCB(), [countriesListCB]);

    function getValues() {
        return Object.keys(countriesList.object()).map((country) => {
            return { name: country, label: countriesList.get(country) };
        });
    }

    if (props.field === FieldType.COUNTRY) {
        return (
            <MaterialValueEditor
                className={props.className}
                type={props.type}
                values={getValues()}
                value={props.value}
                field={props.field}
                fieldData={props.fieldData}
                operator={props.operator}
                valueSource={props.valueSource}
                handleOnChange={props.handleOnChange}
                path={props.path}
                level={props.level}
                schema={props.schema}
                rule={props.rule}
            />
        );
    }
    return <MaterialValueEditor {...props} />;
};
export default ValueEditor;
