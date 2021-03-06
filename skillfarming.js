(function(exports) {
    exports.app = new Vue({
        // the root element that will be compiled
        el: "#skill-farming-app",

        // app initial state
        data: {
            defaults: {
                spPerHour: 2700,
                characterCount: 1
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
                brokerRelations: 4
            },
            prices: {
                lastEvepraisalPollTime: 0,
                pollingInterval: 1800000, // minimum milliseconds that must elapse between polls (30 min)
                plexBuy: 0,
                extractorBuy: 0,
                injectorBuy: 0,
                injectorSell: 0
            },
            skills: {
                accounting: {
                    base: 0.02,
                    change: 0.002 // flat
                },
                brokerRelations: {
                    base: 0.03,
                    change: 0.001 // flat
                }
            },
            id: {
                item: {
                    oldplex: 29668,
                    plex: 44992,
                    extractor: 40519,
                    injector: 40520
                },
                system: {
                    jita: 30000142,
                    perimeter: 30000144
                }
            }
        },

        /**
         * The statements in this function are executed once, as soon as the Vue app is finished loading.
         */
        ready: function() {
            // attempt to get cached prices from local storage
            var cachedPrices = this.localFetch("prices");
            // if cached prices were found
            if (cachedPrices) {
                // overwrite default prices with cached ones
                this.prices = Object.assign({}, cachedPrices);
                // if cached prices are not fresh, update prices using Evepraisal
                if (
                    Date.now() >
                    this.prices.lastEvepraisalPollTime +
                        this.prices.pollingInterval
                ) {
                    this.updateAllItemPrices();
                }
            }
            // else no cached prices were found; update prices using Evepraisal
            else {
                this.updateAllItemPrices();
            }

            // import any character data from local storage into the characterModels Array
            this.characterModels = this.localFetch("characterModels") || [];
            // if the characterModels Array is still empty, put a single default character in it
            if (!this.characterModels.length) {
                this.addCharacterModel();
            }

            // attempt to get user's custom tax skill levels from local storage
            var storedSkillLevels = this.localFetch("skillLevels");
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
                    this.localStore("characterModels", val);
                }
            },

            skillLevels: {
                deep: true,
                handler: function(val, oldVal) {
                    this.localStore("skillLevels", val);
                }
            },

            prices: {
                deep: true,
                handler: function(val, oldVal) {
                    this.localStore("prices", val);
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
                return (
                    this.skills.accounting.base -
                    parseInt(this.skillLevels.accounting) *
                        this.skills.accounting.change
                );
            },

            /**
             * @returns {Float} Broker's fee rate based on level of Broker Relations
             */
            brokerRate: function() {
                return (
                    this.skills.brokerRelations.base -
                    parseInt(this.skillLevels.brokerRelations) *
                        this.skills.brokerRelations.change
                );
            },

            /**
             * @returns {Float} Number of skillpoints trained per hour based on sp/hr
             */
            spPerHour: function() {
                var totalSpPerHour = 0;
                for (var characterModel of this.characterModels) {
                    totalSpPerHour +=
                        parseInt(characterModel.spPerHour) *
                        parseInt(characterModel.characterCount);
                }
                return totalSpPerHour;
            },

            /**
             * @returns {Float} Number of skillpoints trained per month based on sp/hr
             */
            spPerMonth: function() {
                return this.spPerHour * 24 * 30;
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
                return (
                    this.taxedBuyOrderPrice(this.prices.plexBuy) *
                    450 *
                    this.numberCharacters
                );
            },

            /**
             * @returns {Float} Monthly cost of extractors based on taxes, number of characterModels, and sp/month
             */
            taxedExtractorBuy: function() {
                return (
                    this.taxedBuyOrderPrice(this.prices.extractorBuy) *
                    this.extractorsPerMonth
                );
            },

            /**
             * @returns {Float} Monthly revenue of injectors based on taxes, number of characterModels, and sp/month
             */
            taxedInjectorSell: function() {
                return (
                    this.taxedSellOrderPrice(this.prices.injectorSell) *
                    this.injectorsPerMonth
                );
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

            /**
             * returns {Float} Cost of injectors needed to start all character models from scratch
             */
            startCostInjectTotal: function() {
                var total = 0;
                for (var characterModel of this.characterModels) {
                    total += this.startCostInject(characterModel);
                }
                return total;
            },

            /**
             * returns {Float} Cost of plex needed to start all character models from scratch given their sp/hr
             */
            startCostSubTotal: function() {
                var total = 0;
                for (var characterModel of this.characterModels) {
                    total += this.startCostSub(characterModel);
                }
                return total;
            }
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
                    characterCount: this.defaults.characterCount
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
             * Update prices in local state using results of requests to
             * Evepraisal for fresh price data.
             */
            updateAllItemPrices: function() {
                // plex price
                this.getOneItemPrices(this.id.item.plex)
                    .then(response => {
                        this.prices.plexBuy =
                            response.data.summaries[0].prices.buy.max;
                    })
                    .catch(error => {
                        console.log(
                            "Failed to get PLEX buy price from Evepraisal"
                        );
                    });

                // skill extractor price
                this.getOneItemPrices(this.id.item.extractor)
                    .then(response => {
                        this.prices.extractorBuy =
                            response.data.summaries[0].prices.buy.max;
                    })
                    .catch(error => {
                        console.log(
                            "Failed to get Extractor buy price from Evepraisal"
                        );
                    });

                // large skill injector prices
                this.getOneItemPrices(this.id.item.injector)
                    .then(response => {
                        this.prices.injectorBuy =
                            response.data.summaries[0].prices.buy.max;
                        this.prices.injectorSell =
                            response.data.summaries[0].prices.sell.min;
                    })
                    .catch(error => {
                        console.log(
                            "Failed to get Injector buy/sell prices from Evepraisal"
                        );
                    });

                // update the polling timestamp
                this.prices.lastEvepraisalPollTime = Date.now();
            },

            /**
             * Get the prices of an item by querying Evepraisal
             *
             * @param {number} id ID of item to get prices of
             */
            getOneItemPrices(id) {
                const proxyUrl = "https://cors-anywhere.peterhenry.net/";
                const itemUrl = `https://evepraisal.com/item/${id}.json`;
                return axios.get(`${proxyUrl}${itemUrl}`, {
                    // headers: {
                    //     "User-Agent": "mosbasik.github.io/skillfarming"
                    // }
                });
            },

            /**
             * @param {Float} principal Raw price of a buy order
             * @returns {Float} Sum of the buy order's raw price and broker fee
             */
            taxedBuyOrderPrice: function(principal) {
                return principal + principal * this.brokerRate;
            },

            /**
             * @param {Float} principal Raw price of a sell order
             * @returns {Float} Sum of the sell order's raw price, broker fee and sales tax
             */
            taxedSellOrderPrice: function(principal) {
                return (
                    principal -
                    principal * this.brokerRate -
                    principal * this.transactionRate
                );
            },

            /**
             * @param {Object} characterModel Representation of a character model
             * returns {Float} Cost of injectors needed to start this character model from scratch
             */
            startCostInject: function(characterModel) {
                return (
                    this.prices.injectorBuy * 11 * characterModel.characterCount
                );
            },

            /**
             * @param {Object} characterModel Representation of a character model
             * returns {Float} Cost of plex needed to start this character model from scratch given its sp/hr
             */
            startCostSub: function(characterModel) {
                return (
                    this.prices.plexBuy *
                    (this.startTimeSub(characterModel) / 30) *
                    characterModel.characterCount
                );
            },

            /**
             * @param {Object} characterModel Representation of a character model
             * returns {Float} Days needed to start this character model from scratch given its sp/hr
             */
            startTimeSub: function(characterModel) {
                var spPerDay = characterModel.spPerHour * 24;
                var daysNeeded = 5500000 / spPerDay;
                return daysNeeded;
            }
        }
    }); // end of app definition
})(window);
