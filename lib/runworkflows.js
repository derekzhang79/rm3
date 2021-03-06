var Conf = require('./conf');
var WorkflowRunner = require('wf').Runner;
var winston = require('winston');
var path = require('path');
var runner;

/* eslint-disable camelcase */
var config = {
  backend: {
    module: "wf-pg-backend",
    opts: Conf.getEndpoint('workflowPostgres')
  },
  runner: {
    identifier: Conf.getNodeId(),
    forks: 1,
    do_fork: false,
    run_interval: Conf.getConfig('runInterval'),
    activity_interval: Conf.getConfig('runInterval') * 8,
    sandbox: {
      "modules": {
        "workflowtasks": path.join(__dirname, '../lib/workflowtasks/index.js'),
        "async": "async"
      }
    }
  }
};
/* eslint-enable camelcase */

function runWorkflows(next) {
  runner = WorkflowRunner(config);
  runner.init(function(err) {
    if (err) {
      winston.error('workflow', 'Error initializing runner:', err);
    }
    runner.run();
    winston.info('workflow', 'Workflow runner up', {nodeId: Conf.getNodeId()});
    next(err);
  });

  process.on('SIGINT', function() {
    winston.info('workflow', 'Got SIGINT. Stopping workflow');
    runner.quit(function() {
      winston.info('workflow', 'Workflow stopped.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', function() {
    winston.info('workflow', 'Got SIGTERM. Stopping workflow');
    runner.kill(function() {
      winston.info('workflow', 'Workflow stopped.');
      process.exit(0);
    });
  });
}

function killWorkflows() {
  runner.kill(function() {
  });
}

function endWorkflows(next) {
  runner.quit(next);
}

runWorkflows.killWorkflows = killWorkflows;
runWorkflows.endWorkflows = endWorkflows;

exports = module.exports = runWorkflows;
