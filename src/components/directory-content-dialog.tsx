/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UUID } from 'crypto';
import {
    type Dispatch,
    ForwardedRef,
    forwardRef,
    type SetStateAction,
    useCallback,
    useImperativeHandle,
    useState,
} from 'react';
import {
    DescriptionModificationDialog,
    type ElementAttributes,
    ElementType,
    ExpertFilterEditionDialog,
    ExplicitNamingFilterEditionDialog,
    isStudyMetadata,
    LoadFlowParametersEditionDialog,
    NetworkVisualizationsParametersEditionDialog,
    ShortCircuitParametersEditionDialog,
    VoltageInitParametersEditionDialog,
    useSnackMessage,
    SecurityAnalysisParametersDialog,
    SensitivityAnalysisParametersDialog,
    PARAM_LANGUAGE,
} from '@gridsuite/commons-ui';
import type { CellClickedEvent } from 'ag-grid-community';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { getFilterById, updateElement } from '../utils/rest-api';
import { ContingencyListType, FilterType, NetworkModificationType } from '../utils/elementType';
import CompositeModificationDialog from './dialogs/network-modification/composite-modification/composite-modification-dialog';
import CriteriaBasedEditionDialog from './dialogs/contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import ExplicitNamingEditionDialog from './dialogs/contingency-list/edition/explicit-naming/explicit-naming-edition-dialog';
import { setActiveDirectory, setItemSelectionForCopy } from '../redux/actions';
import * as constants from '../utils/UIconstants';
import type { AppState } from '../redux/types';
import { useParameterState } from './dialogs/use-parameters-dialog';
import type { useDirectoryContent } from '../hooks/useDirectoryContent';
import FilterBasedContingencyListDialog from './dialogs/contingency-list/filter-based/contingency-list-filter-based-dialog';

export type DirectoryContentDialogApi = {
    handleClick: (event: CellClickedEvent) => void;
};

export type DirectoryContentDialogProps = {
    broadcastChannel: BroadcastChannel;
    setOpenDialog: Dispatch<SetStateAction<string>>;
    activeElement?: ElementAttributes;
    setActiveElement: Dispatch<SetStateAction<ElementAttributes | undefined>>;
    selectedDirectoryElementUuid?: UUID;
    childrenMetadata: ReturnType<typeof useDirectoryContent>[1];
};

function DirectoryContentDialog(
    {
        setOpenDialog,
        activeElement,
        setActiveElement,
        broadcastChannel,
        selectedDirectoryElementUuid,
        childrenMetadata,
    }: Readonly<DirectoryContentDialogProps>,
    refApi: ForwardedRef<DirectoryContentDialogApi>
) {
    const intl = useIntl();
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const enableDeveloperMode = useSelector((state: AppState) => state.enableDeveloperMode);
    const user = useSelector((state: AppState) => state.user);

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [elementName, setElementName] = useState('');
    const [elementDescription, setElementDescription] = useState('');

    const appsAndUrls = useSelector((state: AppState) => state.appsAndUrls);
    const getStudyUrl = useCallback(
        (elementUuid: string) => {
            const appStudy = appsAndUrls.find(isStudyMetadata);
            if (appStudy) {
                const studyResource = appStudy.resources?.find((resource) =>
                    resource.types.includes(ElementType.STUDY)
                );
                if (studyResource) {
                    return appStudy.url + studyResource.path.replace('{elementUuid}', elementUuid);
                }
            }
            return null;
        },
        [appsAndUrls]
    );

    const [openDescModificationDialog, setOpenDescModificationDialog] = useState(false);
    const handleDescDialogClose = useCallback(() => {
        setActiveElement(undefined);
        setOpenDescModificationDialog(false);
    }, [setActiveElement]);

    /* Filters contingency list dialog: window status value for editing a filters contingency list */
    const [currentFiltersContingencyListId, setCurrentFiltersContingencyListId] = useState<UUID>();
    const handleCloseFiltersContingency = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentFiltersContingencyListId(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    /* Explicit Naming contingency list dialog: window status value for editing an explicit naming contingency list */
    const [currentExplicitNamingContingencyListId, setCurrentExplicitNamingContingencyListId] = useState<UUID>();
    const handleCloseExplicitNamingContingency = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentExplicitNamingContingencyListId(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    /* Filter based contingency list dialog: window status value for editing a filter based contingency list */
    const [currentFilterBasedContingencyListId, setcurrentFilterBasedContingencyListId] = useState<UUID>();
    const handleCloseFilterBasedContingency = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setcurrentFilterBasedContingencyListId(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    const [currentExplicitNamingFilterId, setCurrentExplicitNamingFilterId] = useState<UUID>();
    /* Filters dialog: window status value to edit ExplicitNaming filters */
    const handleCloseExplicitNamingFilterDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentExplicitNamingFilterId(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    const [currentNetworkModificationId, setCurrentNetworkModificationId] = useState<UUID>();
    const handleCloseCompositeModificationDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentNetworkModificationId(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    /* Filters dialog: window status value to edit Expert filters */
    const [currentExpertFilterId, setCurrentExpertFilterId] = useState<UUID>();
    const handleCloseExpertFilterDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentExpertFilterId(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    const [currentParametersId, setCurrentParametersId] = useState<UUID>();
    const [currentParametersType, setCurrentParametersType] = useState<ElementType>();
    const handleCloseParametersDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setCurrentParametersId(undefined);
        setCurrentParametersType(undefined);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    useImperativeHandle(
        refApi,
        () => ({
            handleClick: (event: CellClickedEvent) => {
                if (event.colDef.field === 'description') {
                    setActiveElement(event.data);
                    setOpenDescModificationDialog(true);
                } else if (childrenMetadata[event.data.elementUuid] !== undefined) {
                    setActiveElement(event.data);
                    setElementName(childrenMetadata[event.data.elementUuid].elementName);
                    setElementDescription(childrenMetadata[event.data.elementUuid].description);
                    const subtype = childrenMetadata[event.data.elementUuid].specificMetadata.type as unknown as string;
                    /** set active directory on the store because it will be used while editing the contingency name */
                    dispatch(setActiveDirectory(selectedDirectoryElementUuid));
                    switch (event.data.type) {
                        case ElementType.STUDY: {
                            const url = getStudyUrl(event.data.elementUuid);
                            if (url) {
                                window.open(url, '_blank');
                            } else {
                                snackError({
                                    messageTxt: intl.formatMessage(
                                        { id: 'getAppLinkError' },
                                        { type: event.data.type }
                                    ),
                                });
                            }
                            break;
                        }
                        case ElementType.CONTINGENCY_LIST:
                            if (subtype === ContingencyListType.CRITERIA_BASED.id) {
                                setCurrentFiltersContingencyListId(event.data.elementUuid);
                                setOpenDialog(subtype);
                            } else if (subtype === ContingencyListType.EXPLICIT_NAMING.id) {
                                setCurrentExplicitNamingContingencyListId(event.data.elementUuid);
                                setOpenDialog(subtype);
                            } else if (subtype === ContingencyListType.FILTERS.id) {
                                setcurrentFilterBasedContingencyListId(event.data.elementUuid);
                                setOpenDialog(subtype);
                            }
                            break;
                        case ElementType.FILTER:
                            if (subtype === FilterType.EXPLICIT_NAMING.id) {
                                setCurrentExplicitNamingFilterId(event.data.elementUuid);
                                setOpenDialog(subtype);
                            } else if (subtype === FilterType.EXPERT.id) {
                                setCurrentExpertFilterId(event.data.elementUuid);
                                setOpenDialog(subtype);
                            }
                            break;
                        case ElementType.MODIFICATION:
                            if (subtype === NetworkModificationType.COMPOSITE.id) {
                                setCurrentNetworkModificationId(event.data.elementUuid);
                                setOpenDialog(subtype);
                            }
                            break;
                        case ElementType.LOADFLOW_PARAMETERS:
                        case ElementType.NETWORK_VISUALIZATIONS_PARAMETERS:
                        case ElementType.SHORT_CIRCUIT_PARAMETERS:
                        case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                        case ElementType.VOLTAGE_INIT_PARAMETERS:
                        case ElementType.SENSITIVITY_PARAMETERS:
                            setCurrentParametersId(event.data.elementUuid);
                            setCurrentParametersType(event.data.type);
                            setOpenDialog(constants.DialogsId.EDIT_PARAMETERS);
                            break;
                        default:
                            break;
                    }
                }
            },
        }),
        [
            childrenMetadata,
            dispatch,
            getStudyUrl,
            intl,
            selectedDirectoryElementUuid,
            setActiveElement,
            setOpenDialog,
            snackError,
        ]
    );

    if (openDescModificationDialog && activeElement) {
        return (
            <DescriptionModificationDialog
                open
                description={activeElement.description}
                elementUuid={activeElement.elementUuid}
                onClose={handleDescDialogClose}
                // @ts-expect-error TODO: set UUID as parameter type in commons-ui
                updateElement={updateElement}
            />
        );
    }
    if (currentNetworkModificationId !== undefined) {
        return (
            <CompositeModificationDialog
                open
                titleId="MODIFICATION"
                compositeModificationId={currentNetworkModificationId}
                onClose={handleCloseCompositeModificationDialog}
                name={elementName}
                description={elementDescription}
                broadcastChannel={broadcastChannel}
            />
        );
    }
    if (currentFiltersContingencyListId !== undefined && activeElement) {
        return (
            <CriteriaBasedEditionDialog
                open
                titleId="editContingencyList"
                contingencyListId={currentFiltersContingencyListId}
                contingencyListType={ContingencyListType.CRITERIA_BASED.id}
                onClose={handleCloseFiltersContingency}
                name={elementName}
                broadcastChannel={broadcastChannel}
                description={activeElement.description}
            />
        );
    }

    if (currentExplicitNamingContingencyListId !== undefined && activeElement) {
        return (
            <ExplicitNamingEditionDialog
                open
                titleId="editContingencyList"
                contingencyListId={currentExplicitNamingContingencyListId}
                contingencyListType={ContingencyListType.EXPLICIT_NAMING.id}
                onClose={handleCloseExplicitNamingContingency}
                name={elementName}
                broadcastChannel={broadcastChannel}
                description={activeElement.description}
            />
        );
    }
    if (currentFilterBasedContingencyListId !== undefined && activeElement) {
        return (
            <FilterBasedContingencyListDialog
                titleId="editFilterBasedContingencyList"
                open
                onClose={handleCloseFilterBasedContingency}
                description={activeElement.description}
                name={elementName}
                id={currentFilterBasedContingencyListId}
            />
        );
    }
    if (currentExplicitNamingFilterId !== undefined && activeElement) {
        return (
            <ExplicitNamingFilterEditionDialog
                id={currentExplicitNamingFilterId}
                open
                onClose={handleCloseExplicitNamingFilterDialog}
                titleId="editFilter"
                name={elementName}
                broadcastChannel={broadcastChannel}
                itemSelectionForCopy={itemSelectionForCopy}
                setItemSelectionForCopy={setItemSelectionForCopy}
                getFilterById={getFilterById}
                activeDirectory={activeDirectory}
                language={languageLocal}
                description={activeElement.description}
            />
        );
    }
    if (currentExpertFilterId !== undefined && activeElement) {
        return (
            <ExpertFilterEditionDialog
                id={currentExpertFilterId}
                open
                onClose={handleCloseExpertFilterDialog}
                titleId="editFilter"
                name={elementName}
                broadcastChannel={broadcastChannel}
                itemSelectionForCopy={itemSelectionForCopy}
                setItemSelectionForCopy={setItemSelectionForCopy}
                getFilterById={getFilterById}
                activeDirectory={activeDirectory}
                language={languageLocal}
                description={activeElement.description}
            />
        );
    }
    if (currentParametersId !== undefined && activeElement && activeDirectory) {
        if (currentParametersType === ElementType.LOADFLOW_PARAMETERS) {
            return (
                <LoadFlowParametersEditionDialog
                    id={currentParametersId}
                    open
                    onClose={handleCloseParametersDialog}
                    titleId="editParameters"
                    name={elementName}
                    description={activeElement.description}
                    user={user}
                    activeDirectory={activeDirectory}
                    language={languageLocal}
                    enableDeveloperMode={enableDeveloperMode}
                />
            );
        }
        if (currentParametersType === ElementType.NETWORK_VISUALIZATIONS_PARAMETERS) {
            return (
                <NetworkVisualizationsParametersEditionDialog
                    id={currentParametersId}
                    open
                    onClose={handleCloseParametersDialog}
                    titleId="editParameters"
                    name={elementName}
                    description={activeElement.description}
                    user={user}
                    activeDirectory={activeDirectory}
                    language={languageLocal}
                />
            );
        }
        if (currentParametersType === ElementType.SHORT_CIRCUIT_PARAMETERS) {
            return (
                <ShortCircuitParametersEditionDialog
                    id={currentParametersId}
                    open
                    onClose={handleCloseParametersDialog}
                    titleId="editParameters"
                    name={elementName}
                    description={activeElement.description}
                    user={user}
                    activeDirectory={activeDirectory}
                    language={languageLocal}
                />
            );
        }
        if (currentParametersType === ElementType.VOLTAGE_INIT_PARAMETERS) {
            return (
                <VoltageInitParametersEditionDialog
                    id={currentParametersId}
                    open
                    onClose={handleCloseParametersDialog}
                    titleId="editParameters"
                    name={elementName}
                    description={activeElement.description}
                    user={user}
                    activeDirectory={activeDirectory}
                    language={languageLocal}
                />
            );
        }
        if (currentParametersType === ElementType.SECURITY_ANALYSIS_PARAMETERS) {
            return (
                <SecurityAnalysisParametersDialog
                    id={currentParametersId}
                    open
                    onClose={handleCloseParametersDialog}
                    titleId="editParameters"
                    name={elementName}
                    description={activeElement.description}
                    user={user}
                    activeDirectory={activeDirectory}
                    language={languageLocal}
                />
            );
        }
        if (currentParametersType === ElementType.SENSITIVITY_PARAMETERS) {
            return (
                <SensitivityAnalysisParametersDialog
                    id={currentParametersId}
                    open
                    onClose={handleCloseParametersDialog}
                    titleId="editParameters"
                    name={elementName}
                    description={activeElement.description}
                    user={user}
                    activeDirectory={activeDirectory}
                    language={languageLocal}
                    enableDeveloperMode={enableDeveloperMode}
                />
            );
        }
    }
}

export default forwardRef(DirectoryContentDialog);
