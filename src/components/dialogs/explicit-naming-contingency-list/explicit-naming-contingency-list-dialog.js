import { useSelector } from 'react-redux';
import { useSnackMessage } from '@gridsuite/commons-ui';
import yup from '../../utils/yup-config';
import {
    ELEMENT_NAME,
    EQUIPMENT_TABLE,
    EQUIPMENT_IDS,
    NAME, CONTINGENCY_NAME,
} from '../../utils/field-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    createContingencyList,
    elementExists,
    getContingencyList,
} from '../../../utils/rest-api';
import { useEffect } from 'react';
import { ContingencyListType, ElementType } from '../../../utils/elementType';
import CustomMuiDialog from '../CustomMuiDialog';
import ExplicitNamingFilterForm from '../explicit-naming-filter/explicit-naming-filter-form';
import ExplicitNamingContingencyListForm from './explicit-naming-contingency-list-form';
import { prepareContingencyListForBackend } from '../contingency-list-helper';

const checkNameIsUnique = (name, activeDirectory) => {
    return new Promise((resolve) => {
        elementExists(activeDirectory, name, ElementType.CONTINGENCY_LIST).then(
            (val) => resolve(!val)
        );
    });
};

const emptyFormData = {
    [NAME]: '',
    [EQUIPMENT_TABLE]: [],
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
            .required()
            .nullable()
            .test('checkIfUniqueName', 'nameAlreadyUsed', (name) =>
                checkNameIsUnique(name, activeDirectory)
            ),
        [EQUIPMENT_TABLE]: yup
            .array()
            .min(1, '')
            .of(
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
                    console.log('getContingencyList response', response)
                    const result =
                        response?.identifierContingencyList?.identifiers?.map(
                            (identifiers, index) => {
                                return {
                                    [CONTINGENCY_NAME]: 'contingencyName' + index, // Temporary : at the moment, we do not save the name in the backend.
                                    [EQUIPMENT_IDS]:
                                        identifiers.identifierList.map(
                                            (identifier) =>
                                                identifier.identifier
                                        ),
                                };
                            }
                        );
                    console.log('getContingencyList result', result)
                    reset({
                        [EQUIPMENT_TABLE]: result ?? [],
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
        console.log('testtest new ', data);

        const equipments = prepareContingencyListForBackend(
            null,
            data[NAME],
            data[EQUIPMENT_TABLE]
        );

        console.log('testtest new equipments ', equipments);
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
                    headerId: 'filterCreationError',
                    headerValues: { name: data[NAME] },
                });
            });
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
