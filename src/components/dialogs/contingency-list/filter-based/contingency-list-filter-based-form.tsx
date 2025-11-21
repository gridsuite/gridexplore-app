/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    ArrayAction,
    DescriptionField,
    DirectoryItemsInput,
    ElementType,
    EquipmentType,
    FieldConstants,
    MuiStyles,
    OverflowableChipWithHelperText,
    ResizeHandle,
    UniqueNameInput,
} from '@gridsuite/commons-ui';
import { Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ImperativePanelGroupHandle, Panel, PanelGroup } from 'react-resizable-panels';
import { AppState } from '../../../../redux/types';
import { ContingencyFieldConstants, FilterElement, FilterSubEquipments } from '../../../../utils/contingency-list.type';
import { FilterBasedContingencyListVisualizationPanel } from './filter-based-contingency-list-visualization-panel';
import { isSubstationOrVoltageLevelFilter } from '../contingency-list-utils';
import EquipmentTypesByFilters from './equipment-types-by-filters';

const equipmentTypes: string[] = [
    EquipmentType.SUBSTATION,
    EquipmentType.VOLTAGE_LEVEL,
    EquipmentType.LINE,
    EquipmentType.TWO_WINDINGS_TRANSFORMER,
    EquipmentType.THREE_WINDINGS_TRANSFORMER,
    EquipmentType.GENERATOR,
    EquipmentType.BATTERY,
    EquipmentType.LOAD,
    EquipmentType.SHUNT_COMPENSATOR,
    EquipmentType.STATIC_VAR_COMPENSATOR,
    EquipmentType.HVDC_LINE,
    EquipmentType.DANGLING_LINE,
];

const styles = {
    handle: (theme) => ({
        backgroundColor: 'inherit',
        width: 15,
        marginLeft: 8,
        marginRight: 8,
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderRight: `1px solid ${theme.palette.divider}`,
    }),
} as const satisfies MuiStyles;

// sizes in percent
const LEFT_PANEL_MIN_SIZE = 25;
const LEFT_PANEL_DEFAULT_SIZE = 33;
const RIGHT_PANEL_MIN_SIZE = 25;

interface ContingencyListFilterBasedFormProps {
    isSubOrVlFilterIncluded: boolean;
    setIsSubOrVlFilterIncluded: (value: boolean) => void;
}

export default function ContingencyListFilterBasedForm({
    isSubOrVlFilterIncluded,
    setIsSubOrVlFilterIncluded,
}: Readonly<ContingencyListFilterBasedFormProps>) {
    const { setValue, getValues } = useFormContext();
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const [isDataOutdated, setIsDataOutdated] = useState<boolean>(false);

    const filters: FilterElement[] = useWatch({
        name: FieldConstants.FILTERS,
    }) as unknown as FilterElement[];
    const substationAndVLFilters = filters.filter(isSubstationOrVoltageLevelFilter);

    const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);

    useEffect(() => {
        const panelGroup = panelGroupRef.current;
        if (substationAndVLFilters.length > 0 && !isSubOrVlFilterIncluded) {
            setIsSubOrVlFilterIncluded(true);
            if (panelGroup) {
                panelGroup.setLayout([60, 40]);
            }
        } else if (substationAndVLFilters.length === 0 && isSubOrVlFilterIncluded) {
            setIsSubOrVlFilterIncluded(false);
            if (panelGroup) {
                panelGroup.setLayout([33, 67]);
            }
        }
    }, [substationAndVLFilters, setIsSubOrVlFilterIncluded, isSubOrVlFilterIncluded]);

    // TODO : uncomment when useEffectEvent will be available
    // const theme = useTheme();
    // const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
    // const resizePanelsOnBreakpoint = useEffectEvent(isMdDown => {
    // const panelGroup = panelGroupRef.current;
    //     if (panelGroup) {
    //         if (isMdDown) {
    //             panelGroup.setLayout([50, 50]);
    //         } else if (isSubOrVlFilterIncluded) {
    //             panelGroup.setLayout([33, 67]);
    //         } else {
    //             panelGroup.setLayout([60, 40]);
    //         }
    //     }
    // });
    // useEffect(() => {
    //  onMdDown(isMdDown);
    // }, [isMdDown]);

    const handleFilterOnChange = useCallback(
        (_currentFilters: any, action?: ArrayAction, filter?: FilterElement) => {
            if (!action || !filter) {
                console.error('Action or filter is missing in handleFilterOnChange');
                return;
            }
            if (isSubstationOrVoltageLevelFilter(filter)) {
                const currentSubEquipmentsByFilters = getValues(
                    ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER
                );
                if (action === ArrayAction.ADD) {
                    const newFilterSubEquipments = {
                        [ContingencyFieldConstants.FILTER_ID]: filter.id,
                        [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES]: [],
                    };
                    setValue(ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER, [
                        ...currentSubEquipmentsByFilters,
                        newFilterSubEquipments,
                    ]);
                } else if (action === ArrayAction.REMOVE) {
                    setValue(
                        ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER,
                        currentSubEquipmentsByFilters.filter(
                            (value: FilterSubEquipments) => value[ContingencyFieldConstants.FILTER_ID] !== filter.id
                        )
                    );
                }
            }
            setIsDataOutdated(true);
        },
        [setValue, getValues]
    );

    return (
        <PanelGroup direction="horizontal" ref={panelGroupRef}>
            <Panel defaultSize={LEFT_PANEL_DEFAULT_SIZE} minSize={LEFT_PANEL_MIN_SIZE}>
                <Grid
                    container
                    columnSpacing={1.5}
                    sx={(theme) => ({
                        height: '100%',
                        [theme.breakpoints.up('md')]: {
                            flexWrap: 'nowrap',
                        },
                    })}
                >
                    <Grid item container direction="column" rowSpacing={0.5} xs>
                        <Grid item>
                            <UniqueNameInput
                                name={FieldConstants.NAME}
                                label="nameProperty"
                                elementType={ElementType.CONTINGENCY_LIST}
                                activeDirectory={activeDirectory}
                            />
                        </Grid>
                        <Grid item>
                            <DescriptionField />
                        </Grid>
                        <Grid item>
                            <FormattedMessage id="Filters" />
                        </Grid>
                        <Grid item xs>
                            <DirectoryItemsInput
                                titleId="FiltersListsSelection"
                                label=""
                                name={FieldConstants.FILTERS}
                                elementType={ElementType.FILTER}
                                equipmentTypes={equipmentTypes}
                                onChange={handleFilterOnChange}
                                ChipComponent={OverflowableChipWithHelperText}
                                chipProps={{ variant: 'outlined' }}
                                fullHeight
                            />
                        </Grid>
                    </Grid>
                    {isSubOrVlFilterIncluded && (
                        <EquipmentTypesByFilters
                            substationAndVLFilters={substationAndVLFilters}
                            setIsDataOutdated={setIsDataOutdated}
                        />
                    )}
                </Grid>
            </Panel>
            <ResizeHandle style={styles.handle} />
            <Panel minSize={RIGHT_PANEL_MIN_SIZE}>
                <FilterBasedContingencyListVisualizationPanel
                    isDataOutdated={isDataOutdated}
                    setIsDataOutdated={setIsDataOutdated}
                />
            </Panel>
        </PanelGroup>
    );
}
