/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { UUID } from 'node:crypto';
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
import ExplicitNamingEditionDialog from './dialogs/contingency-list/explicit-naming/explicit-naming-edition-dialog';
import { setActiveDirectory, setItemSelectionForCopy } from '../redux/actions';
import * as constants from '../utils/UIconstants';
import type { AppState } from '../redux/types';
import { useParameterState } from './dialogs/use-parameters-dialog';
import type { useDirectoryContent } from '../hooks/useDirectoryContent';
import FilterBasedContingencyListDialog from './dialogs/contingency-list/filter-based/contingency-list-filter-based-dialog';
import { DirectoryField } from './utils/directory-content-utils';

export type DirectoryContentDialogApi = {
    handleClick: (event: CellClickedEvent) => void;
};

export type DirectoryContentDialogProps = {
    broadcastChannel: BroadcastChannel;
    setOpenDialog: Dispatch<SetStateAction<string>>;
    activeElement?: ElementAttributes;
    setActiveElement: Dispatch<SetStateAction<ElementAttributes | undefined>>;
    selectedDirectoryElementUuid?: UUID;
    selectedDirectoryWritable: boolean;
    childrenMetadata: ReturnType<typeof useDirectoryContent>[1];
};

function DirectoryContentDialog(
    {
        setOpenDialog,
        activeElement,
        setActiveElement,
        broadcastChannel,
        selectedDirectoryElementUuid,
        selectedDirectoryWritable,
        childrenMetadata,
    }: Readonly<DirectoryContentDialogProps>,
    refApi: ForwardedRef<DirectoryContentDialogApi>
) {
    const intl = useIntl();
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const isDeveloperMode = useSelector((state: AppState) => state.enableDeveloperMode);
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

    const closeDialog = useCallback(() => {
        setOpenDialog(constants.DialogsId.NONE);
        setActiveElement(undefined);
        setElementName('');
    }, [setActiveElement, setOpenDialog]);

    const [currentExplicitNamingContingencyListId, setCurrentExplicitNamingContingencyListId] = useState<UUID>();
    const handleCloseExplicitNamingContingency = useCallback(() => {
        setCurrentExplicitNamingContingencyListId(undefined);
        closeDialog();
    }, [closeDialog]);

    const [currentFilterBasedContingencyListId, setCurrentFilterBasedContingencyListId] = useState<UUID>();
    const handleCloseFilterBasedContingency = useCallback(() => {
        setCurrentFilterBasedContingencyListId(undefined);
        closeDialog();
    }, [closeDialog]);

    const [currentExplicitNamingFilterId, setCurrentExplicitNamingFilterId] = useState<UUID>();
    const handleCloseExplicitNamingFilterDialog = useCallback(() => {
        setCurrentExplicitNamingFilterId(undefined);
        closeDialog();
    }, [closeDialog]);

    const [currentNetworkModificationId, setCurrentNetworkModificationId] = useState<UUID>();
    const handleCloseCompositeModificationDialog = useCallback(() => {
        setCurrentNetworkModificationId(undefined);
        closeDialog();
    }, [closeDialog]);

    const [currentExpertFilterId, setCurrentExpertFilterId] = useState<UUID>();
    const handleCloseExpertFilterDialog = useCallback(() => {
        setCurrentExpertFilterId(undefined);
        closeDialog();
    }, [closeDialog]);

    const [currentParametersId, setCurrentParametersId] = useState<UUID>();
    const [currentParametersType, setCurrentParametersType] = useState<ElementType>();
    const handleCloseParametersDialog = useCallback(() => {
        setCurrentParametersId(undefined);
        setCurrentParametersType(undefined);
        closeDialog();
    }, [closeDialog]);

    const openStudyTab = useCallback(
        (studyUuid: UUID) => {
            const url = getStudyUrl(studyUuid);
            if (url) {
                window.open(url, '_blank');
            } else {
                snackError({
                    messageTxt: intl.formatMessage({ id: 'getAppLinkError' }, { type: ElementType.STUDY }),
                });
            }
        },
        [getStudyUrl, intl, snackError]
    );

    const openContingencyListDialog = useCallback(
        (elementId: UUID, subType: string) => {
            if (subType === ContingencyListType.EXPLICIT_NAMING.id) {
                setCurrentExplicitNamingContingencyListId(elementId);
                setOpenDialog(subType);
            } else if (subType === ContingencyListType.FILTERS.id) {
                setCurrentFilterBasedContingencyListId(elementId);
                setOpenDialog(subType);
            }
        },
        [setOpenDialog]
    );

    const openFilterDialog = useCallback(
        (elementId: UUID, subType: string) => {
            if (subType === FilterType.EXPLICIT_NAMING.id) {
                setCurrentExplicitNamingFilterId(elementId);
                setOpenDialog(subType);
            } else if (subType === FilterType.EXPERT.id) {
                setCurrentExpertFilterId(elementId);
                setOpenDialog(subType);
            }
        },
        [setOpenDialog]
    );

    const openModificationDialog = useCallback(
        (elementId: UUID, subType: string) => {
            if (subType === NetworkModificationType.COMPOSITE.id) {
                setCurrentNetworkModificationId(elementId);
                setOpenDialog(subType);
            }
        },
        [setOpenDialog]
    );

    const openParametersDialog = useCallback(
        (elementId: UUID, parameterType: ElementType) => {
            setCurrentParametersId(elementId);
            setCurrentParametersType(parameterType);
            setOpenDialog(constants.DialogsId.EDIT_PARAMETERS);
        },
        [setOpenDialog]
    );

    useImperativeHandle(
        refApi,
        () => ({
            handleClick: (event: CellClickedEvent) => {
                if (!selectedDirectoryWritable) {
                    /** no element can be opened */
                    return;
                }
                if (event.colDef.field === DirectoryField.DESCRIPTION) {
                    /** open description dialog */
                    setActiveElement(event.data);
                    setOpenDescModificationDialog(true);
                    return;
                }

                /** open element */
                const elementId = event.data.elementUuid;
                const metadata = childrenMetadata[elementId];
                if (metadata) {
                    setActiveElement(event.data);
                    setElementName(metadata.elementName);
                    setElementDescription(metadata.description);
                    const subtype = metadata.specificMetadata.type;
                    /** set active directory on the store because it will be used while editing the contingency name */
                    dispatch(setActiveDirectory(selectedDirectoryElementUuid));

                    switch (event.data.type) {
                        case ElementType.STUDY:
                            openStudyTab(elementId);
                            break;
                        case ElementType.CONTINGENCY_LIST:
                            openContingencyListDialog(elementId, subtype);
                            break;
                        case ElementType.FILTER:
                            openFilterDialog(elementId, subtype);
                            break;
                        case ElementType.MODIFICATION:
                            openModificationDialog(elementId, subtype);
                            break;
                        case ElementType.LOADFLOW_PARAMETERS:
                        case ElementType.NETWORK_VISUALIZATIONS_PARAMETERS:
                        case ElementType.SHORT_CIRCUIT_PARAMETERS:
                        case ElementType.SECURITY_ANALYSIS_PARAMETERS:
                        case ElementType.VOLTAGE_INIT_PARAMETERS:
                        case ElementType.SENSITIVITY_PARAMETERS:
                            openParametersDialog(elementId, event.data.type);
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
            openStudyTab,
            openContingencyListDialog,
            openFilterDialog,
            openModificationDialog,
            openParametersDialog,
            selectedDirectoryElementUuid,
            selectedDirectoryWritable,
            setActiveElement,
        ]
    );

    if (activeElement) {
        if (openDescModificationDialog) {
            return (
                <DescriptionModificationDialog
                    open
                    description={activeElement.description}
                    elementUuid={activeElement.elementUuid}
                    onClose={handleDescDialogClose}
                    updateElement={updateElement}
                />
            );
        }
        if (currentNetworkModificationId) {
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
        if (currentExplicitNamingContingencyListId) {
            return (
                <ExplicitNamingEditionDialog
                    open
                    titleId="editContingencyList"
                    contingencyListId={currentExplicitNamingContingencyListId}
                    onClose={handleCloseExplicitNamingContingency}
                    name={elementName}
                    broadcastChannel={broadcastChannel}
                    description={activeElement.description}
                />
            );
        }
        if (currentFilterBasedContingencyListId) {
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
        if (currentExplicitNamingFilterId) {
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
                    isDeveloperMode={isDeveloperMode}
                />
            );
        }
        if (currentExpertFilterId) {
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
                    isDeveloperMode={isDeveloperMode}
                />
            );
        }

        if (currentParametersId && activeDirectory) {
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
                        enableDeveloperMode={isDeveloperMode}
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
                        enableDeveloperMode={isDeveloperMode}
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
                        enableDeveloperMode={isDeveloperMode}
                    />
                );
            }
        }
    }
}

export default forwardRef(DirectoryContentDialog);
