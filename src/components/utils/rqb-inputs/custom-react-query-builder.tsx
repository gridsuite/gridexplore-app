/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Grid from '@mui/material/Grid';
import { QueryBuilderDnD } from '@react-querybuilder/dnd';
import * as ReactDnD from 'react-dnd';
import * as ReactDndHtml5Backend from 'react-dnd-html5-backend';
import { QueryBuilderMaterial } from '@react-querybuilder/material';
import {
    Field,
    formatQuery,
    QueryBuilder,
    RuleGroupTypeAny,
} from 'react-querybuilder';
import {
    countRules,
    getOperators,
    queryValidator,
} from '../../dialogs/filter/expert/expert-filter-utils';
import { ErrorInput, FieldErrorAlert } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';
import { useFormContext } from 'react-hook-form';
import RemoveButton from 'components/utils/rqb-inputs/remove-button';
import CombinatorSelector from 'components/utils/rqb-inputs/combinator-selector';
import AddButton from 'components/utils/rqb-inputs/add-button';
import ValueEditor from './value-editor';
import ValueSelector from './value-selector';
import { useCallback, useMemo } from 'react';
import { COMBINATOR_OPTIONS } from '../../dialogs/filter/expert/expert-filter-constants';

interface CustomReactQueryBuilderProps {
    name: string;
    fields: Field[];
}

const CustomReactQueryBuilder = (props: CustomReactQueryBuilderProps) => {
    const {
        getValues,
        setValue,
        watch,
        formState: { isSubmitted }, // Set to true after the form is submitted. Will remain true until the reset method is invoked.
    } = useFormContext();
    const intl = useIntl();

    const query = watch(props.name);

    // Ideally we should "clean" the empty groups after DnD as we do for the remove button
    // But it's the only callback we have access to in this case,
    // and we don't have access to the path, so it can't be done in a proper way
    const handleQueryChange = useCallback(
        (newQuery: RuleGroupTypeAny) => {
            const oldQuery = getValues(props.name);
            const hasQueryChanged =
                formatQuery(oldQuery, 'json_without_ids') !==
                formatQuery(newQuery, 'json_without_ids');
            const hasAddedRules = countRules(newQuery) > countRules(oldQuery);
            setValue(props.name, newQuery, {
                shouldDirty: hasQueryChanged,
                shouldValidate:
                    isSubmitted && hasQueryChanged && !hasAddedRules,
            });
        },
        [getValues, setValue, isSubmitted, props.name]
    );

    const combinators = useMemo(() => {
        return Object.values(COMBINATOR_OPTIONS).map((c) => ({
            name: c.name,
            label: intl.formatMessage({ id: c.label }),
        }));
    }, [intl]);

    return (
        <>
            <Grid item xs={12}>
                <QueryBuilderMaterial>
                    <QueryBuilderDnD
                        dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}
                    >
                        <QueryBuilder
                            fields={props.fields}
                            query={query}
                            addRuleToNewGroups={true}
                            combinators={combinators}
                            onQueryChange={handleQueryChange}
                            getOperators={(fieldName) =>
                                getOperators(fieldName, intl)
                            }
                            validator={queryValidator}
                            controlClassnames={{
                                queryBuilder: 'queryBuilder-branches',
                            }}
                            controlElements={{
                                addRuleAction: (props) => (
                                    <AddButton {...props} label="rule" />
                                ),
                                addGroupAction: (props) => (
                                    <AddButton {...props} label="subGroup" />
                                ),
                                combinatorSelector: CombinatorSelector,
                                removeRuleAction: RemoveButton,
                                removeGroupAction: RemoveButton,
                                valueEditor: ValueEditor,
                                operatorSelector: ValueSelector,
                                fieldSelector: ValueSelector,
                                valueSourceSelector: ValueSelector,
                            }}
                            listsAsArrays
                        />
                    </QueryBuilderDnD>
                </QueryBuilderMaterial>
            </Grid>
            <Grid item xs={12}>
                <ErrorInput name={props.name} InputField={FieldErrorAlert} />
            </Grid>
        </>
    );
};

export default CustomReactQueryBuilder;
