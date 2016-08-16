

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
                lastEveCentralPollTime: 0,
                pollingInterval: 1800000,  // minimum milliseconds that must elapse between polls (30 min)
                plexBuy: 0,
                extractorBuy: 0,
                injectorSell: 0,
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
            id: {
                item: {
                    plex: 29668,
                    extractor: 40519,
                    injector: 40520,
                },
                system: {
                    jita: 30000142,
                    perimeter: 30000144,
                },
            },
        },

        /**
         * The statements in this function are executed once, as soon as the Vue app is finished loading.
         */
        ready: function() {

            // attempt to get cached prices from local storage
            var cachedPrices = this.localFetch('prices');
            // if cached prices were found
            if (cachedPrices) {
                // overwrite default prices with cached ones
                this.prices = Object.assign({}, cachedPrices);
                // if cached prices are not fresh, get updated prices from Eve Central
                if (Date.now() > (this.prices.lastEveCentralPollTime + this.prices.pollingInterval)) {
                    this.getPrices();
                }
            }
            // else no cached prices were found, so get updated prices from Eve Central
            else {
                this.getPrices();
            }

            // import any character data from local storage into the characterModels Array
            this.characterModels = this.localFetch('characterModels') || [];
            // if the characterModels Array is still empty, put a single default character in it
            if (!(this.characterModels.length)) {
                this.addCharacterModel();
            }

            // attempt to get user's custom tax skill levels from local storage
            var storedSkillLevels = this.localFetch('skillLevels');
            // if custom levels were found, overwrite the default levels with the custom ones
            if (storedSkillLevels) {
                this.skillLevels = Object.assign({}, storedSkillLevels);
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

            prices: {
                deep: true,
                handler: function(val, oldVal) {
                    this.localStore('prices', val);
                }
            }
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
             * @param {String} key Key of a value saved in localStorage
             * @returns {Object} Contents of localStorage with specified key, parsed into JSON
             */
            localFetch: function(key) {
                return JSON.parse(localStorage.getItem(key));
            },

            /**
             * Clears the localStorage
             */
            localClear: function() {
                localStorage.clear();
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
             * Polls Eve Central for updated plex, extractor and injector prices
             */
            getPrices: function() {

                var url = `https://api.eve-central.com/api/marketstat?` +
                            `typeid=${    this.id.item.plex      }&` +
                            `typeid=${    this.id.item.extractor }&` +
                            `typeid=${    this.id.item.injector  }&` +
                            `usesystem=${ this.id.system.jita    }`;

                this.$http.get(url).then((response) => {
                    // success
                    // console.log('successful eve central call');

                    // set up a parser to extract data from the returned string-formatted XML
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(response.text(), 'application/xml');

                    // extract the plex price
                    this.prices.plexBuy = parseFloat(doc.getElementById(this.id.item.plex)
                                                        .getElementsByTagName('buy')[0]
                                                        .getElementsByTagName('max')[0]
                                                        .childNodes[0]
                                                        .nodeValue);

                    // extract the skill extractor price
                    this.prices.extractorBuy = parseFloat(doc.getElementById(this.id.item.extractor)
                                                             .getElementsByTagName('buy')[0]
                                                             .getElementsByTagName('max')[0]
                                                             .childNodes[0]
                                                             .nodeValue);

                    // extract the skill injector price
                    this.prices.injectorSell = parseFloat(doc.getElementById(this.id.item.injector)
                                                            .getElementsByTagName('sell')[0]
                                                            .getElementsByTagName('min')[0]
                                                            .childNodes[0]
                                                            .nodeValue);

                    // update the polling timestamp
                    this.prices.lastEveCentralPollTime = Date.now();
                }, (response) => {
                    // failure
                    // console.log('failed eve central call');
                });

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
