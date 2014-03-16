define(['./variants'], function (variants) {
    'use strict';

    angular.module('angular-variants', [])
        .provider('angularVariants', ['$provide', function ($provide) {

            function replaceService(oldService, newService) {
                $provide.decorator(oldService, ['$injector', function ($injector) {
                    return $injector.get(newService);
                }]);
            }

            this.registerConditionType = function (conditionType) {
                variants.registerConditionType(conditionType);
            }
            this.applyVariants = function(variantsConfig, context) {
                var mods = variants.getMods(variantsConfig, context);
                if (mods) {
                    for (var key in mods) {
                        replaceService(key, mods[key]);
                    }
                }
            }

            this.$get = function() {};
        }])
    ;
});