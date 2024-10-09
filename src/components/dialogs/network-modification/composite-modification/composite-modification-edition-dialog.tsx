/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, SyntheticEvent, useEffect, useState } from 'react';
import { useParameterState } from '../../use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../../../utils/config-params';
import {
    CustomMuiDialog,
    FieldConstants,
    useModificationLabelComputer,
    useSnackMessage,
    yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getCompositeModificationContent } from '../../../../utils/rest-api';
import { CriteriaBasedEditionFormData } from '../../contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import CompositeModificationEditionForm from './composite-modification-edition-form';
import { List, ListItem } from '@mui/material';
import { useIntl } from 'react-intl';
import { NetworkModificationMetadata } from '@gridsuite/commons-ui/dist/hooks/useModificationLabelComputer';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
});

const emptyFormData = (name?: string) => ({
    [FieldConstants.NAME]: name,
});

interface FormData {
    [FieldConstants.NAME]: string;
}

interface CompositeModificationEditionDialogProps {
    compositeModificationListId: string;
    open: boolean;
    onClose: (event?: SyntheticEvent) => void;
    titleId: string;
    name: string;
}

export const styles = {
    // TODO : those styles should probably be fetched inside commons-ui (once my version is integrated)
    FillerContainer: {
        height: '100%',
        '&::before': {
            content: '""',
            height: '100%',
            float: 'left',
        },
    },
    ScrollableContainer: {
        paddingY: '12px',
        position: 'relative',
        '&::after': {
            content: '""',
            clear: 'both',
            display: 'block',
        },
    },
    ScrollableContent: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'auto',
    },
};

const CompositeModificationEditionDialog: FunctionComponent<CompositeModificationEditionDialogProps> = ({
    compositeModificationListId,
    open,
    onClose,
    titleId,
    name,
}: Readonly<CompositeModificationEditionDialogProps>) => {
    const intl = useIntl();
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [isFetching, setIsFetching] = useState(!!compositeModificationListId);
    const { snackError } = useSnackMessage();
    const [modifications, setModifications] = useState<NetworkModificationMetadata[]>([]);

    const methods = useForm<FormData>({
        defaultValues: emptyFormData(name),
        resolver: yupResolver(schema),
    });

    const { computeLabel } = useModificationLabelComputer();
    const getModificationLabel = (modif: NetworkModificationMetadata) => {
        if (!modif) {
            return null;
        }
        return intl.formatMessage(
            { id: 'network_modifications.' + modif.type },
            {
                ...modif,
                ...computeLabel(modif),
            }
        );
    };

    const renderNetworkModificationsList = () => {
        return (
            <Box sx={styles.ScrollableContainer}>
                {modifications && (
                    <List sx={styles.ScrollableContent}>
                        {modifications.map((modification: NetworkModificationMetadata) => (
                            <>
                                <ListItem key={modification.uuid}> {getModificationLabel(modification)} </ListItem>
                                <Divider component="li" />
                            </>
                        ))}
                    </List>
                )}
            </Box>
        );
    };

    useEffect(() => {
        setIsFetching(true);
        getCompositeModificationContent(compositeModificationListId)
            .then((response) => {
                if (response) {
                    setModifications(response);
                }
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'cannotRetrieveContingencyList',
                });
            })
            .finally(() => setIsFetching(false));
    }, [compositeModificationListId, name, snackError]);

    const closeAndClear = (event?: SyntheticEvent) => {
        onClose(event);
    };

    const onSubmit = (contingencyList: CriteriaBasedEditionFormData) => {
        // TODO : SAUVE LE NOM
    };

    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            titleId={titleId}
            onSave={onSubmit}
            removeOptional={true}
            isDataFetching={isFetching}
            language={languageLocal}
            formSchema={schema}
            formMethods={methods}
            unscrollableFullHeight
        >
            {!isFetching && (
                <Box sx={styles.FillerContainer}>
                    <CompositeModificationEditionForm />
                    {renderNetworkModificationsList()}
                </Box>
            )}
        </CustomMuiDialog>
    );
};

export default CompositeModificationEditionDialog;
