import { DirectoryItemsInput, DndColumn, DndColumnType, DndTable, ElementType } from '@gridsuite/commons-ui';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';

export function UpdateSaProcessConfigModifications() {
    const intl = useIntl();
    const useFieldArrayModifications = useFieldArray({
        name: `modifications`,
    });
    const { getValues } = useFormContext();
    console.log('VALUES', getValues());

    const { fields } = useFieldArrayModifications;
    console.log('fields', fields);
    const columnsDefinition = useMemo<DndColumn[]>(() => {
        return [
            {
                label: intl.formatMessage({ id: 'modifications' }),
                dataKey: 'modification',
                initialValue: [],
                editable: true,
                type: DndColumnType.CUSTOM,
                //TODO: TOFIX
                // eslint-disable-next-line react/no-unstable-nested-components
                component: (rowIndex: number) => (
                    <DirectoryItemsInput
                        name={`modifications[${rowIndex}].modification`}
                        allowMultiSelect={false}
                        elementType={ElementType.MODIFICATION}
                        titleId="modifications"
                        label={undefined}
                    />
                ),
            },
        ];
    }, [intl]);

    const createModification = () => [{ modification: [] }];

    return (
        <DndTable
            name="modifications"
            useFieldArrayOutput={useFieldArrayModifications}
            createRows={createModification}
            columnsDefinition={columnsDefinition}
            withAddRowsDialog={false}
        />
    );
}
