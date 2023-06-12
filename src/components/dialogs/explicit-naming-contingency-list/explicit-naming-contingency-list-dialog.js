import { useSelector } from 'react-redux';
import { useSnackMessage } from '@gridsuite/commons-ui';
import yup from '../../utils/yup-config';
import {
    CONTINGENCY_NAME,
    EQUIPMENT_ID,
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE,
    NAME,
} from '../../utils/field-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    createContingencyList,
    elementExists,
    getContingencyList,
    saveExplicitNamingContingencyList,
} from '../../../utils/rest-api';
import { useEffect } from 'react';
import { ContingencyListType, ElementType } from '../../../utils/elementType';
import CustomMuiDialog from '../CustomMuiDialog';
import ExplicitNamingContingencyListForm from './explicit-naming-contingency-list-form';
import { prepareContingencyListForBackend } from '../contingency-list-helper';

const checkNameIsUnique = (name, activeDirectory) => {
    if (!name) {
        return false;
    }
    return new Promise((resolve) => {
        elementExists(activeDirectory, name, ElementType.CONTINGENCY_LIST).then(
            (val) => resolve(!val)
        );
    });
};
const DEFAULT_TABLE_ROWS = [{}, {}, {}];
const emptyFormData = {
    [EQUIPMENT_ID]: null,
    [NAME]: '',
    [EQUIPMENT_TABLE]: DEFAULT_TABLE_ROWS,
};

const ExplicitNamingContingencyListDialog = ({
    contingencyListId,
    onClose,
    open,
    titleId,
}) => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const { snackError } = useSnackMessage();

    const schema = yup.object().shape({
        [NAME]: yup
            .string()
            .nullable()
            .when([EQUIPMENT_ID], {
                is: null,
                then: (schema) =>
                    schema
                        .required('nameEmpty')
                        .test('checkIfUniqueName', 'nameAlreadyUsed', (name) =>
                            checkNameIsUnique(name, activeDirectory)
                        ),
            }),
        [EQUIPMENT_TABLE]: yup.array().of(
            yup.object().shape({
                [CONTINGENCY_NAME]: yup.string().nullable(),
                [EQUIPMENT_IDS]: yup.array().of(yup.string().nullable()),
            })
        ),
    });

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset } = methods;

    useEffect(() => {
        if (contingencyListId) {
            getContingencyList(
                ContingencyListType.EXPLICIT_NAMING,
                contingencyListId
            ).then((response) => {
                if (response) {
                    const result =
                        response?.identifierContingencyList?.identifiers?.map(
                            (identifiers, index) => {
                                return {
                                    [CONTINGENCY_NAME]:
                                        'contingencyName' + index, // Temporary : at the moment, we do not save the name in the backend.
                                    [EQUIPMENT_IDS]:
                                        identifiers.identifierList.map(
                                            (identifier) =>
                                                identifier.identifier
                                        ),
                                };
                            }
                        );
                    reset({
                        [EQUIPMENT_ID]: contingencyListId,
                        [EQUIPMENT_TABLE]: result ?? DEFAULT_TABLE_ROWS,
                    });
                }
            });
        }
    }, [contingencyListId, reset]);

    const closeAndClear = (event) => {
        reset(emptyFormData, { keepDefaultValues: true });
        onClose(event);
    };

    const handleClose = (event) => {
        closeAndClear(event);
    };

    const onSubmit = (data) => {
        if (contingencyListId) {
            const equipments = prepareContingencyListForBackend(
                contingencyListId,
                contingencyListId,
                data[EQUIPMENT_TABLE] ?? []
            );
            saveExplicitNamingContingencyList(equipments ?? [])
                .then(() => {
                    handleClose();
                })
                .catch((errorMessage) => {
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'contingencyListCreationError',
                        headerValues: { name: data[NAME] },
                    });
                });
        } else {
            const equipments = prepareContingencyListForBackend(
                contingencyListId ?? null,
                data[NAME],
                data[EQUIPMENT_TABLE] ?? []
            );
            createContingencyList(
                ContingencyListType.EXPLICIT_NAMING,
                data[NAME],
                equipments,
                activeDirectory
            )
                .then(() => handleClose())
                .catch((errorMessage) => {
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'contingencyListEditingError',
                        headerValues: { name: data[NAME] },
                    });
                });
        }
    };
    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            schema={schema}
            methods={methods}
            titleId={titleId}
        >
            <ExplicitNamingContingencyListForm />
        </CustomMuiDialog>
    );
};

export default ExplicitNamingContingencyListDialog;
