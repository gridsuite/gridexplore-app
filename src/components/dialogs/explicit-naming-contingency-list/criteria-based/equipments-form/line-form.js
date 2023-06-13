import CountriesInput from "../../../../utils/countries-input";
import {COUNTRIES_1, COUNTRIES_2} from "../../../../utils/field-constants";

const LineForm = ({

}) => {
    const countries1 = (
        <CountriesInput
            name={COUNTRIES_1}
        />
    );

    const countries2 = (
        <CountriesInput
            name={COUNTRIES_2}
        />
    );
};

export default LineForm;