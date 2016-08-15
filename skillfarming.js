

(function (exports) {


    exports.app = new Vue({

        // the root element that will be compiled
        el: '#skill-farming-app',

        // app initial state
        data: {
            defaults: {
                spPerHour: 2700,
                characterCount: 1,
            },
            characterModels: [
                // Structure of example characterModel:
                // {
                //     spPerHour: 2700,
                //     characterCount: 1,
                // }
            ],
            skillLevels: {
                accounting: 4,
                brokerRelations: 4,
            },
            prices: {
                plexBuy: 1005001706.01,
                extractorBuy: 230000101.01,
                injectorSell: 618996449.00,
            },
            skills: {
                accounting: {
                    base: 0.02,
                    change: 0.002, // flat
                },
                brokerRelations: {
                    base: 0.03,
                    change: 0.001, // flat
                },
            },
        },

        /**
         * The statements in this function are executed once, as soon as the Vue app is finished loading.
         */
        ready: function() {
            // import any character data from local storage into the characterModels Array
            this.characterModels = this.localFetch('characterModels', []);

            // if the characterModels Array is still empty, put a single default character in it
            if (!this.characterModels.length) {
                this.addCharacterModel();
            }

            // attempt to get user's custom tax skill levels from local storage
            var storeSkillLevels = this.localFetch('skillLevels', NaN);

            // if custom levels were found, overwrite the default levels with the custom ones
            if (storeSkillLevels) {
                this.skillLevels = Object.assign({}, storeSkillLevels);
            }
        },

        // watchers (when any of these structures change, run their handler functions)
        watch: {

            characterModels: {
                deep: true,
                handler: function(val, oldVal) {
                    this.localStore('characterModels', val);
                },
            },

            skillLevels: {
                deep: true,
                handler: function(val, oldVal) {
                    this.localStore('skillLevels', val);
                },
            },
        },

        // computed properties
        computed: {

            characterModelsRepr: function() {
                return JSON.stringify(this.characterModels);
            },

            /**
             * @returns {Float} Transaction fee rate based on level of Accounting
             */
            transactionRate: function() {
                return this.skills.accounting.base - (parseInt(this.skillLevels.accounting) * this.skills.accounting.change);
            },
            
            /**
             * @returns {Float} Broker's fee rate based on level of Broker Relations
             */
            brokerRate: function() {
                return this.skills.brokerRelations.base - (parseInt(this.skillLevels.brokerRelations) * this.skills.brokerRelations.change);
            },

            /**
             * @returns {Float} Number of skillpoints trained per month based on sp/hr
             */
            spPerMonth: function() {
                var totalSpPerHour = 0;
                for (var characterModel of this.characterModels) {
                    totalSpPerHour += (parseInt(characterModel.spPerHour) * parseInt(characterModel.characterCount));
                }
                return totalSpPerHour * 24 * 30;
            },

            /**
             * @returns {Integer} Number of plex consumed by farm characters per month
             */
            numberCharacters: function() {
                var count = 0;
                for (var characterModel of this.characterModels) {
                    count += parseInt(characterModel.characterCount);
                }
                return count;
            },

            /**
             * @returns {Float} Number of extractors that can be filled per month based on SP per hour
             */
            extractorsPerMonth: function() {
                return this.spPerMonth / 500000;
            },

            /**
             * @returns {Float} Number of injectors that can be sold per month based on SP per hour
             */
            injectorsPerMonth: function() {
                return this.extractorsPerMonth;
            },

            /**
             * @returns {Float} Monthly cost of PLEXes based on taxes and number of characterModels
             */
            taxedPlexBuy: function() {
                return this.taxedBuyOrderPrice(this.prices.plexBuy) * this.numberCharacters;
            },

            /**
             * @returns {Float} Monthly cost of extractors based on taxes, number of characterModels, and sp/month
             */
            taxedExtractorBuy: function() {
                return this.taxedBuyOrderPrice(this.prices.extractorBuy) * this.extractorsPerMonth;
            },

            /**
             * @returns {Float} Monthly revenue of injectors based on taxes, number of characterModels, and sp/month
             */
            taxedInjectorSell: function() {
                return this.taxedSellOrderPrice(this.prices.injectorSell) * this.injectorsPerMonth;
            },

            /**
             * @returns {Float} Sum of all monthly costs
             */
            totalCost: function() {
                return this.taxedPlexBuy + this.taxedExtractorBuy;
            },

            /**
             * @returns {Float} Sum of all monthly revenue
             */
            totalRevenue: function() {
                return this.taxedInjectorSell;
            },

        },

        // methods that implement data logic
        methods: {

            /**
             * @param {String} key Key of data to be stored in localStorage
             * @param {Object} value Data to be stored in localStorage
             */
            localStore: function(key, value) {
                localStorage.setItem(key, JSON.stringify(value));
            },

            /**
             * @param {String} key Key of a value saved in localstorage
             * @param defaultReturn Value that is returned if the key doesn't exist in localStorage
             * @returns {Object} Contents of localStorage with that key
             */
            localFetch: function(key, defaultReturn) {
                return JSON.parse(localStorage.getItem(key) || defaultReturn);
            },

            /**
             * Adds a new default character to the character Object.
             */
            addCharacterModel: function() {
                // create a new character from the default settings
                var newCharacterModel = {
                    spPerHour: this.defaults.spPerHour,
                    characterCount: this.defaults.characterCount,
                };

                // add the new characterModel to the Array of characterModels
                this.characterModels.push(newCharacterModel);
            },

            /**
             * Removes specified character from the character Object.
             */
            removeCharacterModel: function(characterModel) {
                this.characterModels.$remove(characterModel);
            },

            /**
             * @param {Float} principal Raw price of a buy order
             * @returns {Float} Sum of the buy order's raw price and broker fee
             */
            taxedBuyOrderPrice: function(principal) {
                return principal + (principal * this.brokerRate);
            },

            /**
             * @param {Float} principal Raw price of a sell order
             * @returns {Float} Sum of the sell order's raw price, broker fee and sales tax
             */
            taxedSellOrderPrice: function(principal) {
                return principal - (principal * this.brokerRate) - (principal * this.transactionRate);
            },

        },

    }); // end of app definition

})(window);
