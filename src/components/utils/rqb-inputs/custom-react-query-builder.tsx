/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Grid from '@mui/material/Grid';
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
import { useCallback, useMemo } from 'react';
import { COMBINATOR_OPTIONS } from '../../dialogs/filter/expert/expert-filter-constants';

interface CustomReactQueryBuilderProps {
    name: string;
    fields: Field[];
}

const CustomReactQueryBuilder = (props: CustomReactQueryBuilderProps) => {
    const { getValues, setValue, watch } = useFormContext();
    const intl = useIntl();

    const query = watch(props.name);

    const handleQueryChange = useCallback(
        (newQuery: RuleGroupTypeAny) => {
            const oldQuery = getValues(props.name);
            const hasQueryChanged =
                formatQuery(oldQuery, 'json_without_ids') !==
                formatQuery(newQuery, 'json_without_ids');
            const hasAddedRules = countRules(newQuery) > countRules(oldQuery);
            setValue(props.name, newQuery, {
                shouldDirty: hasQueryChanged,
                shouldValidate: hasQueryChanged && !hasAddedRules,
            });
        },
        [getValues, setValue, props.name]
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
                                <AddButton {...props} label="group" />
                            ),
                            combinatorSelector: CombinatorSelector,
                            removeRuleAction: RemoveButton,
                            removeGroupAction: RemoveButton,
                            valueEditor: ValueEditor,
                        }}
                    />
                </QueryBuilderMaterial>
            </Grid>
            <Grid item xs={12}>
                <ErrorInput name={props.name} InputField={FieldErrorAlert} />
            </Grid>
        </>
    );
};

export default CustomReactQueryBuilder;
