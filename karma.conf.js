
// Karma configuration

var karma = require('karma');

module.exports = function (config) {
    config.set(
        {

            plugins: [
                'karma-jasmine',
                'karma-junit-reporter',
                'karma-coverage',
                'karma-requirejs',
                'karma-phantomjs-launcher'
            ],

            // base path, that will be used to resolve files and exclude
            basePath: '',

            frameworks: ["jasmine", "requirejs"],

            // list of files / patterns to load in the browser
            files: [
                'htdocs/components/jquery/dist/jquery.js',
                'htdocs/components/jasmine-jquery/lib/jasmine-jquery.js',
                'htdocs/components/angular/angular.js',
                'htdocs/components/angular-mocks/angular-mocks.js',
                'htdocs/_test/test-main.js',
                // these are served via the file server but not included or loaded
                // these files are meant to be loaded via requirejs
                {pattern: 'htdocs/**/*.js', included: false},
                {pattern: 'htdocs/**/*.html', included: false},
            ],

            // list of files to exclude
            exclude: [
                'htdocs/components/requirejs/require.js', // never load this, karma has its own require.js
            ],

            preprocessors: {
                'htdocs/*.js': 'coverage'
            },

            // test results reporter to use
            // possible values: dots || progress || growl
            reporters: ['progress', 'junit', 'coverage'],
            junitReporter: {
                outputFile: '_build/test-results.xml'
            },
            coverageReporter: {
                type: 'cobertura',
                dir: '_build',
                file: 'coverage.xml'
            },

            // web server port
            port: 8080,

            // cli runner port
            runnerPort: 9100,

            // enable / disable colors in the output (reporters and logs)
            colors: true,

            // level of logging
            // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
            logLevel: config.LOG_INFO,

            // enable / disable watching file and executing tests whenever any file changes
            autoWatch: true,

            // Start these browsers, currently available:
            // - Chrome
            // - ChromeCanary
            // - Firefox
            // - Opera
            // - Safari (only Mac)
            // - PhantomJS
            // - IE (only Windows)
            browsers: ['PhantomJS'],

            // If browser does not capture in given timeout [ms], kill it
            captureTimeout: 5000,

            // Continuous Integration mode
            // if true, it capture browsers, run tests and exit
            singleRun: false

        }
    );
};
