define(function () {
    'use strict';

    function _isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function _isString(s) {
        return typeof(s) === 'string';
    }

    function _isArray(arr) {
        return arr instanceof Array;
    }

    function _isObject(arr) {
        return arr instanceof Object;
    }
    
    function _isArrayOfStrings(arr) {
        if (! _isArray(arr)) {
            return false;
        }
        if (arr.length === 0) {
            return false;
        }
        for (var i = 0; i < arr.length; i++) {
            if (! _isString(arr[i])) {
                return false;
            }
        }
        return true;
    }

    var VariantConfigError = function (message) {
        this.name = 'VariantConfigError';
        this.message = message;
    }
    VariantConfigError.prototype = new Error();

    var Variants = function () {
        this._conditionTypes = {};
        this.registerConditionType(AlwaysCondition);
        this.registerConditionType(NeverCondition);
        this.registerConditionType(UsersCondition);
        this.registerConditionType(GroupsCondition);
        this.registerConditionType(RandomCondition);
        this.registerConditionType(RandomModCondition);
        this.registerConditionType(UsernameModCondition);
        this.registerConditionType(GoogleExperimentsCondition);
    }

    Variants.prototype = {

        registerConditionType: function (conditionType) {
            this._conditionTypes[conditionType.prototype.type] = conditionType;
        },

        getMods: function (variantsConfig, context) {
            context = context || {};
            var variantsInUrl = this._getVariantsFromUrl(context);
            var allMods = {};

            if (! _isArray(variantsConfig)) {
                throw new VariantConfigError('variants should be a list');
            }

            for (var i = 0; i < variantsConfig.length; i++) {
                var mods = this._getModsForVariant(variantsConfig[i], context, variantsInUrl);
                if (mods) {
                    for (var key in mods) {
                        allMods[key] = mods[key];
                    }
                }
            }
            return allMods;
        },

        _getModsForVariant: function (variantConfig, context, variantsInUrl) {

            // Sanity checking
            if (! _isString(variantConfig.id)) {
                throw new VariantConfigError('Every variant must have an string id');
            }
            if (! _isArray(variantConfig.conditions) || variantConfig.conditions.length == 0) {
                throw new VariantConfigError('A variant must have conditions');
            }
            if (! _isObject(variantConfig.mods)) {
                throw new VariantConfigError('A variant must have mods');
            }

            var id = variantConfig.id;

            var allowsUrlOverrides = variantConfig.allowUrlOverrides === true;
            var urlOverride = allowsUrlOverrides && variantsInUrl.indexOf(id) !== -1;


            var conditions = this._parseConditions(variantConfig.conditions);
            var conditionOperatorAll = this._parseConditionalOperator(variantConfig);
            if (urlOverride || this._testConditions(conditions, conditionOperatorAll, context)) {
                return variantConfig.mods;
            }
            else {
                return null;
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

        _getVariantsFromUrl: function(context) {
            var param = this._getUrlParam(context, 'variants');
            if (param) {
                return param.split(',');
            }
            else {
                return [];
            }
        },

        _getUrlParam: function(context, name) {
            var search;
            if (context.search) {
                search = context.search;
            }
            else if (document.location.search) {
                search = document.location.search.substring(1);
            }

            if (search) {
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
                if (! _isString(variantConfig.conditionalOperator)) {
                    throw new VariantConfigError('conditionalOperator should be AND or OR');
                }
                var conditionalOperator = variantConfig.conditionalOperator.toLowerCase();
                if (conditionalOperator === 'and') {
                    return true;
                }
                else if (conditionalOperator === 'or') {
                    return false;
                }
                else {
                    throw new VariantConfigError('conditionalOperator should be AND or OR');
                }
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
            if (conditionConfig.type == null) {
                throw new VariantConfigError('Every condition must have a type');
            }
            else if (! _isString(conditionConfig.type)) {
                throw new VariantConfigError('Condition type must be a string');
            }
            else if (! this._conditionTypes.hasOwnProperty(conditionConfig.type)) {
                throw new VariantConfigError('Unknown condition type: ' + conditionConfig.type);
            }

            var conditionClass = this._conditionTypes[conditionConfig.type];
            return new conditionClass(conditionConfig);
        },
    }

    var AlwaysCondition = function (config) {
    }

    AlwaysCondition.prototype = {
        type: 'ALWAYS',

        test: function (context) {
            return true;
        }
    }

    var NeverCondition = function (config) {
    }

    NeverCondition.prototype = {
        type: 'NEVER',

        test: function (context) {
            return false;
        }
    }

    var UsersCondition = function (config) {
        if (! _isArrayOfStrings(config.values)) {
            throw new VariantConfigError("USERS requires values to be a list of usernames");
        }
        this.values = config.values;
    }

    UsersCondition.prototype = {
        type: 'USERS',

        test: function (context) {
            return context.username && this.values.indexOf(context.username) !== -1;
        }
    }

    var GroupsCondition = function (config) {
        if (! _isArrayOfStrings(config.values)) {
            throw new VariantConfigError("GROUPS requires groups to be a list of groups");
        }
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
        if (! _isNumber(config.value)) {
            throw new VariantConfigError("RANDOM requires value to be a number");
        }
        if (config.value < 0 || config.value > 1) {
            throw new VariantConfigError("RANDOM requires value to be a number between 0 and 1");
        }
        this.value = config.value;
    }

    RandomCondition.prototype = {
        type: 'RANDOM',

        test: function (context) {
            return Math.random() < this.value;
        }
    }

    var RandomModCondition = function (config) {
        if (! _isNumber(config.from) || ! _isNumber(config.to)) {
            throw new VariantConfigError("RANDOM_MOD requires from and to to be numbers");
        }
        if (config.from < 0 || config.to > 100) {
            throw new VariantConfigError("RANDOM_MOD requires a range between 0 and 100");
        }
        if (config.from >= config.to) {
            throw new VariantConfigError("RANDOM_MOD cannot have from >= to");
        }

        this.from = config.from;
        this.to = config.to;
    }

    RandomModCondition.prototype = {
        type: 'RANDOM_MOD',

        test: function (context) {
            // We need to use the same random value for all conditions, so store it on the context.
            if (! context._RandomModCondition_Value) {
                context._RandomModCondition_Value = Math.floor(Math.random()*100);
            }
            return context._RandomModCondition_Value >= this.from && context._RandomModCondition_Value < this.to;
        }
    }

    var UsernameModCondition = function (config) {
        if (! _isNumber(config.from) || ! _isNumber(config.to)) {
            throw new VariantConfigError("RANDOM_MOD requires from and to to be numbers");
        }
        if (config.from < 0 || config.to > 100) {
            throw new VariantConfigError("RANDOM_MOD requires a range between 0 and 100");
        }
        if (config.from >= config.to) {
            throw new VariantConfigError("RANDOM_MOD cannot have from >= to");
        }

        this.from = config.from;
        this.to = config.to;
    }

    UsernameModCondition.prototype = {
        type: 'USERNAME_MOD',

        test: function (context) {
            if (context.username) {
                // Hack to inject fake hash function in context for testing
                var hashFunction = context._hash || this._hash;
                var value = hashFunction(context.username);
                return value >= this.from && value < this.to;
            }
            else {
                return false;
            }
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
        if (! _isNumber(config.variation) || Math.floor(config.variation) !== config.variation
                || config.variation < 0) {
            throw new VariantConfigError("GOOGLE_EXPERIMENTS requires integer variation");
        }
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

    return new Variants();
});