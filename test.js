//https://github.com/angular/angular.js/issues/2274

define(['variants'], function(variants) {
    'use strict';

    beforeEach(function () {
        this.addMatchers({
            toThrowA: function(expected) {
                var exception;

                if (typeof this.actual !== 'function') {
                    throw new Error('Actual is not a function');
                }
                if (typeof expected !== 'string') {
                    throw new Error('Type is not a string');
                }

                try {
                    this.actual();
                } catch (e) {
                    exception = e;
                }

                if (!exception) {
                    this.message = function() {
                        return 'Expected function to throw an exception';
                    };
                    return false;
                }
                if (! this.env.equals_(exception.name, expected)) {
                    this.message = function() {
                        return 'Expected function to throw a ' + expected;
                    };
                    return false;
                }

                return true;
            }
        });
    });

    describe('Conditions', function() {    

        var testMods = {
            a: 'b'
        };        

        function conditionShouldPass(condition, context, allowUrlOverrides) {
            var config = [
                {
                    id: 'my-test',
                    conditions: [condition],
                    mods: testMods
                }
            ];
            if (allowUrlOverrides === true) {
                config[0].allowUrlOverrides = true;
            }

            var mods = variants.getMods(config, context);
            expect(mods).toEqual(testMods);
        }

        function conditionShouldFail(condition, context) {
            var config = [
                {
                    id: 'my-test',
                    conditions: [condition],
                    mods: testMods
                }
            ];
            var mods = variants.getMods(config, context);
            expect(mods).toEqual({});
        }

        function conditionShouldThrow(condition, context) {
            var config = [
                {
                    id: 'my-test',
                    conditions: [condition],
                    mods: testMods
                }
            ];
            expect(function() {
                variants.getMods(config, context);
            }).toThrowA('VariantConfigError');
        }

        it('unknown condition should throw', function() {
            conditionShouldThrow({type: 'FOO'});
        });

        it('condition without type should throw', function() {
            conditionShouldThrow({});
        });

        it('always condition should pass', function () {
            conditionShouldPass({type: 'ALWAYS'});
        });

        it('never condition should fail', function () {
            conditionShouldFail({type: 'NEVER'});
        });

        it('users condition requires array of users', function() {
            conditionShouldThrow({type: 'USERS'});
            conditionShouldThrow({type: 'USERS', values: 'user'});
            conditionShouldThrow({type: 'USERS', values: []});
            conditionShouldThrow({type: 'USERS', values: [1, 2, 3]});
        });

        it('users condition works correctly', function() {
            conditionShouldPass({type: 'USERS', values: ['user1', 'user2']}, {username: 'user1'});
            conditionShouldFail({type: 'USERS', values: ['user1', 'user2']}, {username: 'user3'});
            conditionShouldFail({type: 'USERS', values: ['user1', 'user2']}, {});
        });

        it('groups condition requires array of groups', function() {
            conditionShouldThrow({type: 'GROUPS'});
            conditionShouldThrow({type: 'GROUPS', values: 'group'});
            conditionShouldThrow({type: 'GROUPS', values: []});
            conditionShouldThrow({type: 'GROUPS', values: [1, 2, 3]});
        });

        it('groups condition works correctly', function() {
            conditionShouldPass({type: 'GROUPS', values: ['group1', 'group2']}, {groups: ['group1']});
            conditionShouldPass({type: 'GROUPS', values: ['group1', 'group2']}, {groups: ['group3', 'group1']});
            conditionShouldFail({type: 'GROUPS', values: ['group1', 'group2']}, {groups: ['group3']});
            conditionShouldFail({type: 'GROUPS', values: ['group1', 'group2']}, {groups: []});
            conditionShouldFail({type: 'GROUPS', values: ['group1', 'group2']}, {});
        });

        it('random condition requires valid threshold', function() {
            conditionShouldThrow({type: 'RANDOM'});
            conditionShouldThrow({type: 'RANDOM', value: 'string'});
            conditionShouldThrow({type: 'RANDOM', value: -.5});
            conditionShouldThrow({type: 'RANDOM', value: 1.1});
        });

        it('random condition works correctly', function() {
            var spy = spyOn(Math, 'random');
            spy.andReturn(.7);
            conditionShouldPass({type: 'RANDOM', value: .75});

            spy.andReturn(.8);
            conditionShouldFail({type: 'RANDOM', value: .75});
        });

        it('random mod condition requires valid from and to', function() {
            conditionShouldThrow({type: 'RANDOM_MOD'});
            conditionShouldThrow({type: 'RANDOM_MOD', from: 3});
            conditionShouldThrow({type: 'RANDOM_MOD', to: 3});
            conditionShouldThrow({type: 'RANDOM_MOD', from: 3, to: 'a'});
            conditionShouldThrow({type: 'RANDOM_MOD', from: -1, to: 20});
            conditionShouldThrow({type: 'RANDOM_MOD', from: 10, to: 101});
            conditionShouldThrow({type: 'RANDOM_MOD', from: 5, to: 4});
        });

        it('random mod condition works correctly', function() {
            var firstMods = {a: 'b'};
            var secondMods = {c: 'd'};

            var config = [
                {
                    id: 'first',
                    conditions: [{type: 'RANDOM_MOD', from: 0, to: 99}],
                    mods: firstMods
                },
                {
                    id: 'second',
                    conditions: [{type: 'RANDOM_MOD', from: 99, to: 100}],
                    mods: secondMods
                }
            ];

            var spy = spyOn(Math, 'random');
            spy.andReturn(.5);
            expect(variants.getMods(config, {})).toEqual(firstMods);
            
            spy.andReturn(.99);
            expect(variants.getMods(config, {})).toEqual(secondMods);
        });

        it('username mod condition requires valid from and to', function() {
            conditionShouldThrow({type: 'USERNAME_MOD'});
            conditionShouldThrow({type: 'USERNAME_MOD', from: 3});
            conditionShouldThrow({type: 'USERNAME_MOD', to: 3});
            conditionShouldThrow({type: 'USERNAME_MOD', from: 3, to: 'a'});
            conditionShouldThrow({type: 'USERNAME_MOD', from: -1, to: 20});
            conditionShouldThrow({type: 'USERNAME_MOD', from: 10, to: 101});
            conditionShouldThrow({type: 'USERNAME_MOD', from: 5, to: 4});
        });

        it('username mod condition works correctly', function() {
            var firstMods = {a: 'b'};
            var secondMods = {c: 'd'};

            var config = [
                {
                    id: 'first',
                    conditions: [{type: 'USERNAME_MOD', from: 0, to: 99}],
                    mods: firstMods
                },
                {
                    id: 'second',
                    conditions: [{type: 'USERNAME_MOD', from: 99, to: 100}],
                    mods: secondMods
                }
            ];

            var context = {_hash: function() {}};

            // No username, always false
            expect(variants.getMods(config, context)).toEqual({});

            context.username = 'username';
            var spy = spyOn(context, '_hash');
            spy.andReturn(50);
            expect(variants.getMods(config, context)).toEqual(firstMods);
            expect(spy).toHaveBeenCalledWith('username');
            
            spy.andReturn(99);
            expect(variants.getMods(config, context)).toEqual(secondMods);
        });

        it('username hash works correctly', function() {
            var firstMods = {a: 'a'};
            var secondMods = {a: 'b'};

            var config = [
                {
                    id: 'first',
                    conditions: [{type: 'RANDOM_MOD', from: 0, to: 10}],
                    mods: firstMods
                },
                {
                    id: 'second',
                    conditions: [{type: 'RANDOM_MOD', from: 90, to: 100}],
                    mods: secondMods
                }
            ];

            // Rather than mock the hash function to have a deterministic result,
            // I actually to test that the hash function performs as expected and
            // distributes results evenly.  So run a whole bunch of tests, and then
            // check that we get a reasonalbe number within each bucket.  A little
            // ugly, but it works.
            var firstModsCount = 0;
            var secondModsCount = 0;

            function uuid() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
            }

            var testCases = 10000;
            for (var i = 0; i < testCases; i++) {
                var mods = variants.getMods(config, {username: uuid()});
                if (mods.a === 'a') {
                    firstModsCount++;
                }
                else if (mods.a === 'b') {
                    secondModsCount++;
                }
            }

            // Each bucket should have testCases/10 results, or 1000. Make sure we're
            // within a percent of that.
            expect(Math.abs(testCases/10-firstModsCount)).toBeLessThan(.01*testCases);
            expect(Math.abs(testCases/10-secondModsCount)).toBeLessThan(.01*testCases);
        });

        it('GA condition requires variation', function() {
            conditionShouldThrow({type: 'GOOGLE_EXPERIMENTS'});
            conditionShouldThrow({type: 'GOOGLE_EXPERIMENTS', variation: 'string'});
            conditionShouldThrow({type: 'GOOGLE_EXPERIMENTS', variation: .5});
            conditionShouldThrow({type: 'GOOGLE_EXPERIMENTS', variation: -1});
        });

        it('GA condition works correctly', function() {
            // No cxApi
            conditionShouldFail({type: 'GOOGLE_EXPERIMENTS', variation: 1});

            window.cxApi = {chooseVariation: function() {return 1;}};
            conditionShouldFail({type: 'GOOGLE_EXPERIMENTS', variation: 0});
            conditionShouldPass({type: 'GOOGLE_EXPERIMENTS', variation: 1});
            conditionShouldFail({type: 'GOOGLE_EXPERIMENTS', variation: 2});
        });

        it('url overrides work correctly', function() {
            conditionShouldFail({type: 'NEVER'});
            conditionShouldFail({type: 'NEVER'}, {search: 'variants=foo,bar'});
            conditionShouldFail({type: 'NEVER'}, {search: 'variants=foo,bar'}, true);
            conditionShouldPass({type: 'NEVER'}, {search: 'variants=foo,my-test'}, true);
            conditionShouldPass({type: 'NEVER'}, {search: 'foo=bar&variants=foo,my-test'}, true);
        });

        it('conditional operator works', function() {

            function testConditionalOperator(type1, type2, operator) {
                var config = [{
                    id: 'my-test',
                    conditions: [{type: type1}, {type: type2}],
                    mods: testMods,
                    conditionalOperator: operator
                }];
                return variants.getMods(config, {});
            }

            expect(testConditionalOperator('ALWAYS', 'NEVER', 'OR')).toEqual(testMods);
            expect(testConditionalOperator('NEVER', 'ALWAYS', 'OR')).toEqual(testMods);
            expect(testConditionalOperator('NEVER', 'NEVER', 'OR')).toEqual({});
            expect(testConditionalOperator('ALWAYS', 'ALWAYS', 'OR')).toEqual(testMods);

            expect(testConditionalOperator('ALWAYS', 'NEVER', 'AND')).toEqual({});
            expect(testConditionalOperator('NEVER', 'ALWAYS', 'AND')).toEqual({});
            expect(testConditionalOperator('NEVER', 'NEVER', 'AND')).toEqual({});
            expect(testConditionalOperator('ALWAYS', 'ALWAYS', 'AND')).toEqual(testMods);

            expect(testConditionalOperator('ALWAYS', 'NEVER', 'and')).toEqual({});
            expect(function() {
                testConditionalOperator('ALWAYS', 'NEVER', 'bad');
            }).toThrowA('VariantConfigError');
        });

        it('config checks validity', function() {
            function checkThrows(config) {
                expect(function() {
                    variants.getMods(config, {});
                }).toThrowA('VariantConfigError');
            }

            // Not a list
            checkThrows({
                id: 'my-test',
                conditions: [{type: 'ALWAYS'}],
                mods: testMods
            });

            // Missing ID
            checkThrows([{
                conditions: [{type: 'ALWAYS'}],
                mods: testMods
            }]);

            // No conditions
            checkThrows([{
                id: 'my-test',
                mods: testMods
            }]);

            // Empty conditions
            checkThrows([{
                id: 'my-test',
                conditions: [],
                mods: testMods
            }]);

            // No mods
            checkThrows([{
                id: 'my-test',
                conditions: [{type: 'ALWAYS'}],
            }]);
        });
    });

});