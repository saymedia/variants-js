/* DO NOT UPDATE THIS FILE IN YOUR REPOSITORY. IT IS MANAGED BY FINCH */

/*global process, module*/
var mountFolder = function (connect, dir) {
    'use strict';
    return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').filter(function (task) {
        return task !== 'grunt-cli';
    }).forEach(grunt.loadNpmTasks);

    var path = require('path');
    var projectName = path.basename(path.resolve('.'));

    // configurable paths
    var pathConfig = {
        htdocs: 'htdocs',
        dist: 'dist/static',
    };

    grunt.initConfig({
        paths: pathConfig,
        docular: {
            baseUrl: '/',
            showAngularDocs: false,
            showDocularDocs: false,
            docAPIOrder: ['doc'],
            groups: [
                {
                    groupTitle: projectName,
                    groupId: projectName,
                    sections: [
                        {
                            id: projectName,
                            title: projectName,
                            docs: [
                                'docs'
                            ],
                            scripts: [
                                'htdocs'
                            ]
                        },
                    ]
                }
            ]
        },
        watch: { // is this empty definition needed?
        },
        connect: {
            options: {
                port: process.env.PHOENIX_PORT || 9000,
                hostname: '0.0.0.0'
            },
            server: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, pathConfig.htdocs),
                        ];
                    }
                }
            },
        },
        open: {
            server: {
                url: 'http://localhost:<%= connect.options.port %>/_test/index.html'
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
            },
            all: [
                '<%= paths.htdocs %>/**/*.js',
                '!<%= paths.htdocs %>/components/**/*.js'
            ],
            junit: {
                options: {
                    reporter: require('jshint-junit-reporter'),
                    reporterOutput: '_build/jshint-results.xml',
                },
                files: {
                    src: [
                        '<%= paths.htdocs %>/**/*.js',
                        '!<%= paths.htdocs %>/components/**/*.js'
                    ],
                },
            },
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },
    });

    grunt.renameTask('regarde', 'watch');

    grunt.registerTask('lint', [
        'jshint:all',
    ]);

    // cli unit tests, run by user and jenkins.
    grunt.registerTask('test', [
        'karma',
        'jshint:junit',
    ]);

    // Start a test server, one can hit locally to see qunit run (similar to
    // what jenkins would do)
    // This currently requires double maintenance of the runner (karma + this)
    // which we would like to avoid eventually.
    grunt.registerTask('server', [
        'connect',
        'open',
        'watch'
    ]);

    grunt.registerTask('default', ['test']);
    grunt.registerTask('build', []); // remove this once tau can succeed even if a build doesn't happen

    return grunt;
};
