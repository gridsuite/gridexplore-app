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
    getOperators,
    queryValidator,
} from '../../dialogs/filter/expert/expert-filter-utils';
import { ErrorInput, FieldErrorAlert } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import RemoveButton from 'components/utils/rqb-inputs/remove-button';
import CombinatorSelector from 'components/utils/rqb-inputs/combinator-selector';
import AddButton from 'components/utils/rqb-inputs/add-button';
import ValueEditor from './value-editor';
import { EXPERT_FILTER_QUERY } from '../../dialogs/filter/expert/expert-filter-form';
import { useMemo } from 'react';
import { COMBINATOR_OPTIONS } from '../../dialogs/filter/expert/expert-filter-constants';

interface CustomReactQueryBuilderProps {
    name: string;
    fields: Field[];
}

const CustomReactQueryBuilder = (props: CustomReactQueryBuilderProps) => {
    const { getValues, setValue } = useFormContext();
    const intl = useIntl();

    const query = useWatch({
        name: props.name,
    });

    const handleQueryChange = (newQuery: RuleGroupTypeAny) => {
        const hasChanged =
            formatQuery(getValues(EXPERT_FILTER_QUERY), 'json_without_ids') !==
            formatQuery(newQuery, 'json_without_ids');
        setValue(props.name, newQuery, {
            shouldDirty: hasChanged,
            shouldValidate: hasChanged,
        });
    };

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