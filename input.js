import Picker from './picker.js';
import Localisation from './localisations.js';
import DateFormat from './dateformat.js';

export default class Input {
    constructor(input) {
        this.element = input;
        this.element.setAttribute(`data-has-picker`, ``);

        this.locale =
            this.element.getAttribute(`lang`)
            || document.body.getAttribute(`lang`)
            || `en`;

        this.firstDayOfWeek =
            this.element.getAttribute(`data-first-day`)
            || document.body.getAttribute(`data-first-day`)
            || `su`;

        this.format = this.element.getAttribute('date-format')
            || document.body.getAttribute('date-format')
            || this.element.getAttribute(`data-date-format`)
            || document.body.getAttribute(`data-date-format`)
            || `yyyy-mm-dd`;

        this.localeLabels = this.getLocaleLabels();

        Object.defineProperties(
            this.element,
            {
                'valueAsDate': {
                    get: () => {
                        if (!this.element.value) {
                            return null;
                        }
                        const format = this.format || 'yyyy-mm-dd';
                        const parts = this.element.value.match(/(\d+)/g);
                        let i = 0, fmt = {};

                        format.replace(/(yyyy|dd|mm)/g, part => {
                            fmt[part] = i++;
                        });

                        return new Date(parts[fmt['yyyy']], parts[fmt['mm']] - 1, parts[fmt['dd']]);
                    },
                    set: val => {
                        this.element.value = DateFormat(val, this.format);
                    }
                },
                'valueAsNumber': {
                    get: () => {
                        if (!this.element.value) {
                            return NaN;
                        }

                        return this.element.valueAsDate.valueOf();
                    },
                    set: val => {
                        this.element.valueAsDate = new Date(val);
                    }
                },
                'yearRange': {
                    value: this.getYearRange(),
                    writable: true
                }
            },
        );

        // Open the picker when the input get focus,
        // also on various click events to capture it in all corner cases.
        const showPicker = () => {
            const elm = this.element;
            elm.firstDayOfWeek = this.firstDayOfWeek;
            elm.locale = this.localeLabels;
            //const didAttach = Picker.attachTo(elm); <-for checking purposes
            Picker.attachTo(elm);
        };

        this.element.addEventListener(`focus`, showPicker);
        this.element.addEventListener(`mouseup`, showPicker);

        let minYear = this.element.yearRange[0];
        let maxYear = this.element.yearRange[1];

        // Update the picker if the date changed manually in the input.
        this.element.addEventListener(`keydown`, e => {
            let date = new Date();

            switch (e.keyCode) {
                case 9: //hide on tab
                case 27:
                    //hide on esc
                    Picker.hide();
                    break;
                case 37:
                    //arrow left
                    if (this.element.valueAsDate) {
                        date = Picker.returnCurrentDate();
                        date.setDate(date.getDate() - 1);

                        if (date.getFullYear() >= minYear) {
                            this.element.valueAsDate = date;
                        }
                    }
                    break;
                case 38:
                    //arrow up
                    if (this.element.valueAsDate) {
                        date = Picker.returnCurrentDate();
                        date.setDate(date.getDate() - 7);

                        if (date.getFullYear() >= minYear) {
                            this.element.valueAsDate = date;
                        }
                    }
                    break;
                case 39:
                    //arrow right
                    if (this.element.valueAsDate) {
                        date = Picker.returnCurrentDate();
                        date.setDate(date.getDate() + 1);

                        if (date.getFullYear() <= maxYear) {
                            this.element.valueAsDate = date;
                        }
                    }
                    break;
                case 40:
                    //arrow down
                    if (this.element.valueAsDate) {
                        date = Picker.returnCurrentDate();
                        date.setDate(date.getDate() + 7);

                        if (date.getFullYear() <= maxYear) {
                            this.element.valueAsDate = date;
                        }
                    }
                    break;
                default:
                    break;
            }

            //remove to improve performance
            Picker.syncPickerWithInput();
        });

        this.element.addEventListener(`keyup`, function () {
            Picker.syncPickerWithInput();
        });
    }

    getLocaleLabels() {
        const locale = this.locale.toLowerCase();

        for (const localeSet in Localisation) {
            const localeList = localeSet.split(`_`);
            localeList.map(el => el.toLowerCase());

            if (
                !!~localeList.indexOf(locale)
                || !!~localeList.indexOf(locale.substr(0, 2))
            ) {
                return Localisation[localeSet];
            }
        }
    }

    //determines if min and max values are given
    getYearRange() {

        this.minYear = this.element.getAttribute('min');
        this.maxYear = this.element.getAttribute('max');

        //check if values are in correct order and limited in size
        if (this.minYear > 1000 && this.maxYear > 1000
            && this.minYear < 4000 && this.maxYear < 4001
            && this.minYear < this.maxYear) {
            this.yearRange = [];
            this.yearRange.push(this.minYear, this.maxYear);
        } else {
            //return default value if not
            this.yearRange = [1800, 2200];
        }

        return this.yearRange;
    }

    // Return false if the browser does not support input[type="date"].
    static supportsDateInput() {
        const input = document.createElement(`input`);
        input.setAttribute(`type`, `date`);

        const notADateValue = `not-a-date`;
        input.setAttribute(`value`, notADateValue);

        return !(input.value === notADateValue);
    }

    // Will add the Picker to all inputs in the page.
    static addPickerToDateInputs() {
        // Get and loop all the input[type="date"]s in the page that do not have `[data-has-picker]` yet.
        const dateInputs = document.querySelectorAll(`input[type="date"]:not([data-has-picker])`);
        const length = dateInputs.length;

        if (!length) {
            return false;
        }

        for (let i = 0; i < length; ++i) {
            new Input(dateInputs[i]);
        }
    }

    static addPickerToOtherInputs() {

        // Get and loop all the input[type="text"] class date-polyfill in the page that do not have `[data-has-picker]` yet.
        const dateInputs = document.querySelectorAll(`input[type="text"].date-polyfill:not([data-has-picker])`);
        const length = dateInputs.length;

        if (!length) {
            return false;
        }

        for (let i = 0; i < length; ++i) {
            new Input(dateInputs[i]);
        }
    }
}