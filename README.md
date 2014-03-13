# Angular Variants

This library provides a mechanism for selectively enabling and
disabling features within an Angular project.  It is based on
Medium's variants system, available at https://github.com/Obvious/variants.

A variant is an alternative configuration of the project, and consists of the
following elements:

* An id.  Every variant has a unique name, which is used for logging, and
  allows manually selecting a variant via the URL.
* A set of conditions.  The variant will be applied when these conditions
  are true.  By default, the variant will be applied when ANY of the conditions
  are true (OR), but can be configured to be applied when ALL of the conditions
  are true (AND).
* A set of modifications to apply.  These are alternative implementations of
  Angular services or directives that will be injected via the anglular DI system.

## Example
    variants: [
      {
        id: 'my-test',
        conditions: [
          {
            type: 'USERS',
            values: ['jdoe']
          }
        ],
        mods: [
          myService: 'myAlternateService'
        ]
      }
    ]

This defines a single variant called 'my-test', which will be applied for user
jdoe.  For this user, any place we were injecting myService, we will instead
get an instance of myAlternateService.

## Condition Types

### USERS

Apply the variant for a particular list of users.

    conditions: [
    {
      type: 'USERS',
      values: ['user1', 'user2']
    }

### GROUPS

Apply the variant when the current user is in a given group.

    conditions: [
    {
      type: 'GROUPS',
      values: ['group1', 'group2']
    }

### RANDOM

Apply the variant for a random portion of users.

    conditions: [
    {
      type: 'RANDOM',
      value: .25, // Apply to 25% of requests
    }

### RANDOM_MOD

Apply the variant when a random number between 0 (inclusive) and 100 (exclusive)
is in the given range.

    conditions: [
    {
      type: 'RANDOM_MOD',
      from: 0,
      to: 25, // Apply to 25% of requests
    }

This has the same effect as RANDOM, but can be used to apply two different variants
to two different groups.

    variants: [
      {
        id: 'group1',
        conditions: [
          {
            type: 'RANDOM_MOD',
            from: 0,
            to: 25,
          }
        ],
        mods: [
          myService: 'myAlternateService1'
        ]
      },
      {
        id: 'group2',
        conditions: [
          {
            type: 'RANDOM_MOD',
            from: 25,
            to: 50,
          }
        ],
        mods: [
          myService: 'myAlternateService2'
        ]
      }
    ]

The previous configuration will show 25% of users 'group1', 25% 'group2',
and the remaining 50% the normal myService.

### USER_ID_MOD

Hash the user id into a number between 0 (inclusive) and 100 (exclusive),
and apply the variant if the the hash value is in the given range.  This
is equivalent to RANDOM_MOD, but will always put a given user into the
same group rather than reassigning on every page load.

    conditions: [
    {
      type: 'USER_ID_MOD',
      from: 0,
      to: 25, // Apply to 25% of requests
    }

If you do not have authenticated users but still want persistent random
bucketing, the calling application should assign users a random UUID,
store it in a cookie, and return that as the user's username.

### GOOGLE_EXPERIMENTS

Apply the variant based on a Google experiment.  See:
https://developers.google.com/analytics/solutions/experiments-client-side

    conditions: [
    {
      type: 'GOOGLE_EXPERIMENTS',
      experimentId: 'CS32YQFJoEFSUoe2MZWLP-r'
      variation: 1
    }

This will load the experiment with the given id, and apply this variant
if the user is assigned to condition 1.

## CONDITIONAL OPERATOR

If you have multiple conditions and wish to connect them with AND instead of
the default OR, set a conditional operator.

The following will apply the variant if the user is jdoe AND is in group1.

    variants: [
      {
        id: 'my-test',
        conditions: [
          {
            type: 'USERS',
            values: ['jdoe']
          },
          {
            type: 'GROUPS',
            values: ['group1']
          }
        ],
        conditionalOperator: 'AND',  // defaults to OR
        mods: [
          myService: 'myAlternateService'
        ]
      }
    ]

## MODS

A variant is applied using dependency injection, replacing a particular service or
directive with an alternate implementation.

    mods: [
      myProvider: 'myAlternateProvider',
      myService: 'myAlternateService',
      myDirective: 'myAlternateDirective'
    ]

This takes advantage of Angular's DI system to ensure that variants are well-
encapsulated with a well-defined interface, rather than scattering IF and SWITCH
statements around the project.

If you end up requiring a variant that doesn't easily line up with this system and
want a more traditional feature flag, you can just inject a value, and switch on that.

    // ANY INJECTABLE
    myApp.controller('MyCtrl', function ($scope, myVariant) {
      switch (myVariant) {
        case 'normal':
          // ...
        case 'variant1':
          // ...
        case 'variant2':
          // ...
      }
    });

    myApp.constant('myVariant', 'normal');
    myApp.constant('myVariant1', 'variant1');

    // CONFIG
    variants: [
      {
        id: 'my-test',
        conditions: [
          {
            type: 'USERS',
            values: ['jdoe']
          }
        ],
        mods: [
          myVariant: 'myVariant1'
        ]
      }
    ]
