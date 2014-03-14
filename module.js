define([], function () {
    'use strict';

    var Variants = function ($provide) {
        this._conditionTypes = {};
        this._$provide = $provide;
    }

    Variants.prototype = {
        registerConditionType: function (conditionType) {
            this._conditionTypes[conditionType.prototype.type] = conditionType;
        },

        applyVariants: function (variantsConfig, context) {
            var variantsInUrl = this._getVariantsFromUrl();
            for (var i = 0; i < variantsConfig.length; i++) {
                this._applyVariant(variantsConfig[i], context, variantsInUrl);
            }
        },

        _applyVariant: function (variantConfig, context, variantsInUrl) {
            var id = variantConfig.id;
            var allowsUrlOverrides = variantConfig.allowUrlOverrides === true;
            var urlOverride = allowsUrlOverrides && variantsInUrl.indexOf(id) !== -1;

            var conditions = this._parseConditions(variantConfig.conditions);
            var conditionOperatorAll = this._parseConditionalOperator(variantConfig);
            if (urlOverride || this._testConditions(conditions, conditionOperatorAll, context)) {
                this._applyMods(variantConfig.mods);
            }
        },

        _testConditions: function (conditions, conditionOperatorAll, context) {
            for (var i = 0; i < conditions.length; i++) {
                var conditionIsTrue = conditions[i].test(context);
                if (conditionOperatorAll && ! conditionIsTrue) {
                    return false;
                }
                if (! conditionOperatorAll && conditionIsTrue) {
                    return true;
                }
            }
            return conditionOperatorAll;
        },

        _applyMods: function (mods) {
            for (var key in mods) {
                this._applyMod(key, mods[key]);
            }
        },

        _applyMod: function (before, after) {
            this._$provide.decorator(before, ['$delegate', '$injector',
                    function ($delegate, $injector) {
                return $injector.get(after);
            }]);
        },

        _getVariantsFromUrl: function() {
            var param = this._getUrlParam('variants');
            if (param) {
                return param.split(',');
            }
            else {
                return [];
            }
        },

        _getUrlParam: function(name) {
            var search = document.location.search;
            if (search) {
                search = search.substring(1);
                var params = search.split("&");
                for (var i = 0; i < params.length; i++) {
                    var parts = params[i].split('=');
                    if (parts[0] == name) {
                        return parts[1];
                    }
                }
            }
            return null;
        },

        _parseConditionalOperator: function(variantConfig) {
            if (variantConfig.conditionalOperator) {
                return variantConfig.conditionalOperator.toLowerCase() === 'and';
            }
            return false;
        },

        _parseConditions: function (conditionConfigs) {
            var ret = []
            for (var i = 0; i < conditionConfigs.length; i++) {
                ret.push(this._parseCondition(conditionConfigs[i]));
            }
            return ret;
        },

        _parseCondition: function (conditionConfig) {
            var conditionClass = this._conditionTypes[conditionConfig.type];
            return new conditionClass(conditionConfig);
        }
    }

    var UsersCondition = function (config) {
        this.values = config.values;
    }

    UsersCondition.prototype = {
        type: 'USERS',

        test: function (context) {
            return context.username && this.values.indexOf(context.username) !== -1;
        }
    }

    var GroupsCondition = function (config) {
        this.values = config.values;
    }

    GroupsCondition.prototype = {
        type: 'GROUPS',

        test: function (context) {
            if (context.groups) {
                for (var i = 0; i < context.groups.length; i++) {
                    if (this.values.indexOf(context.groups[i]) !== -1) {
                        return true;
                    }
                }
            }
            return false;
        }
    }

    var RandomCondition = function (config) {
        this.value = config.value;
    }

    RandomCondition.prototype = {
        type: 'RANDOM',

        test: function (context) {
            return Math.random() < this.value;
        }
    }

    var RandomModCondition = function (config) {
        this.from = config.from;
        this.to = config.to;
    }

    RandomModCondition.prototype = {
        type: 'RANDOM_MOD',
        value: Math.floor(Math.random()*100),

        test: function (context) {
            return this.value >= this.from && this.value < this.to;
        }
    }

    var UsernameModCondition = function (config) {
        this.from = config.from;
        this.to = config.to;
    }

    UsernameModCondition.prototype = {
        type: 'USERNAME_MOD',

        test: function (context) {
            var value = this._hash(context.username);
            return value >= this.from && value < this.to;
        },

        _hash: function (username) {
            // Java hash algorithm.
            var hash, char = 0;
            for (var i = 0; i < username.length; i++) {
                char = username.charCodeAt(i);
                /* jshint -W016 */
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
                /* jshint +W016 */
            }
            return hash%100;
        },
    }

    var GoogleExperimentsCondition = function (config) {
        this.variation = config.variation;
    }

    GoogleExperimentsCondition.prototype = {
        type: 'GOOGLE_EXPERIMENTS',

        test: function (context) {
            if (window.cxApi) {
                var variation = window.cxApi.chooseVariation();
                return variation === this.variation;
            }
            else {
                return false;
            }
        },
    }

    angular.module('angular-variants', [])
        .provider('angularVariants', ['$provide', function ($provide) {
            var variants = new Variants($provide);
            variants.registerConditionType(UsersCondition);
            variants.registerConditionType(GroupsCondition);
            variants.registerConditionType(RandomCondition);
            variants.registerConditionType(RandomModCondition);
            variants.registerConditionType(UsernameModCondition);
            variants.registerConditionType(GoogleExperimentsCondition);

            this.registerConditionType = function (conditionType) {
                variants.registerConditionType(conditionType);
            }
            this.applyVariants = function(variantsConfig, context) {
                variants.applyVariants(variantsConfig, context);
            }
            this.$get = function() {}
        }])
    ;
});