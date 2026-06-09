import { DirectoryItemsInput, DndColumn, DndColumnType, DndTable, ElementType } from '@gridsuite/commons-ui';
import { useFieldArray } from 'react-hook-form';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

export function UpdateSaProcessConfigModifications() {
    const intl = useIntl();
    const useFieldArrayModifications = useFieldArray({
        name: `modifications`,
    });

    const modificationSelector = useCallback(
        (rowIndex: number) => (
            <DirectoryItemsInput
                name={`modifications[${rowIndex}].modification`}
                allowMultiSelect={false}
                elementType={ElementType.MODIFICATION}
                titleId="modifications"
                label={undefined}
            />
        ),
        []
    );

    const columnsDefinition = useMemo<DndColumn[]>(() => {
        return [
            {
                dataKey: 'modification',
                type: DndColumnType.CUSTOM, // ColumnDirectoryItem does not allow allowMultiSelect to false
                editable: true,
                label: intl.formatMessage({ id: 'modifications' }),
                component: modificationSelector,
            },
        ];
    }, [modificationSelector, intl]);

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
