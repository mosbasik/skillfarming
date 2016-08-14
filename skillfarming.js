

(function (exports) {


    exports.app = new Vue({

        // the root element that will be compiled
        el: '#skill-farming-app',

        // app initial state
        data: {
            input: {
                spPerHour: 2700,
                accountingLevel: 4,
                brokerRelationsLevel: 4,
                numberCharacters: 1,
            },
            prices: {
                plexBuy: 1005001706.01,
                extractorBuy: 230000101.01,
                injectorSell: 618996449.00,
            },
            skills: {
                accounting: {
                    base: .02,
                    change: .002, // flat
                },
                brokerRelations: {
                    base: .03,
                    change: .001, // flat
                }
            },
        },

        // computed properties
        computed: {

            /**
             * @returns {Float} Transaction fee rate based on level of Accounting
             */
            transactionRate: function() {
                return this.skills.accounting.base - (parseInt(this.input.accountingLevel) * this.skills.accounting.change)
            },
            
            /**
             * @returns {Float} Broker's fee rate based on level of Broker Relations
             */
            brokerRate: function() {
                return this.skills.brokerRelations.base - (parseInt(this.input.brokerRelationsLevel) * this.skills.brokerRelations.change)
            },

            /**
             * @returns {Float} Number of skillpoints trained per month based on sp/hr
             */
            spPerMonth: function() {
                return parseFloat(this.input.spPerHour) * 24 * 30;
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
             * @returns {Float} Monthly cost of PLEXes based on taxes and number of characters
             */
            taxedPlexBuy: function() {
                return this.taxedBuyOrderPrice(this.prices.plexBuy) * parseInt(this.input.numberCharacters);
            },

            /**
             * @returns {Float} Monthly cost of extractors based on taxes, number of characters, and sp/month
             */
            taxedExtractorBuy: function() {
                return this.taxedBuyOrderPrice(this.prices.extractorBuy) * parseInt(this.input.numberCharacters) * this.extractorsPerMonth;
            },

            /**
             * @returns {Float} Monthly revenue of injectors based on taxes, number of characters, and sp/month
             */
            taxedInjectorSell: function() {
                return this.taxedSellOrderPrice(this.prices.injectorSell) * parseInt(this.input.numberCharacters) * this.injectorsPerMonth;
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
                return principal - (principal * this.brokerRate) + (principal * this.transactionRate);
            },

        },

    }); // end of app definition

})(window);
