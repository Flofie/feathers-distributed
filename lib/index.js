'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = init;

var _service = require('./service');

var _commons = require('@feathersjs/commons');

var _cote = require('cote');

var _cote2 = _interopRequireDefault(_cote);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-distributed');

function init(options) {
  return function () {
    var distributionOptions = Object.assign({
      publicationDelay: 5000
    }, options);
    var app = this;
    // We need to uniquely identify the app to avoid infinite loop by registering our own services
    app.uuid = (0, _v2.default)();
    debug('Initializing feathers-distributed');

    // This publisher publishes an event each time a local app service is registered
    app.servicePublisher = new _cote2.default.Publisher({
      name: 'feathers services publisher',
      namespace: 'services',
      broadcasts: ['service']
    }, { log: false });
    // Also each time a new node pops up so that it does not depend of the initialization order of the apps
    app.servicePublisher.on('cote:added', function (data) {
      // console.log(data)
      // Add a timeout so that the subscriber has been initialized on the node
      setTimeout(function (_) {
        Object.getOwnPropertyNames(app.services).forEach(function (path) {
          app.servicePublisher.publish('service', { uuid: app.uuid, path: path });
          debug('Republished local service on path ' + path);
        });
      }, distributionOptions.publicationDelay);
    });
    // This subscriber listen to an event each time a remote app service has been registered
    app.serviceSubscriber = new _cote2.default.Subscriber({
      name: 'feathers services subscriber',
      namespace: 'services',
      subscribesTo: ['service']
    }, { log: false });
    // When a remote service is declared create the local proxy interface to it
    app.serviceSubscriber.on('service', function (serviceDescriptor) {
      // Do not register our own services
      if (serviceDescriptor.uuid === app.uuid) {
        debug('Do not register service as remote on path ' + serviceDescriptor.path);
        return;
      }
      // Skip already registered services
      var service = app.service(serviceDescriptor.path);
      if (service) {
        if (service instanceof _service.RemoteService) {
          debug('Already registered service as remote on path ' + serviceDescriptor.path);
        } else {
          debug('Already registered local service on path ' + serviceDescriptor.path);
        }
        return;
      }
      app.use(serviceDescriptor.path, new _service.RemoteService(serviceDescriptor));
      debug('Registered remote service on path ' + serviceDescriptor.path);

      // registering hook object on every remote service
      if (distributionOptions.hooks) {
        app.service(serviceDescriptor.path).hooks(distributionOptions.hooks);
      }
      debug('Registered hooks on remote service on path ' + serviceDescriptor.path);

      // dispatch an event internally through node so that async processes can run
      app.emit('service', serviceDescriptor);
    });

    // We replace the use method to inject service publisher/responder
    var superUse = app.use;
    app.use = function (path, service) {
      // Register the service normally first
      superUse.apply(app, arguments);
      // Note: middlewares are not supported
      // Also avoid infinite loop by registering already registered remote services
      if ((typeof service === 'undefined' ? 'undefined' : _typeof(service)) === 'object' && !service.remote) {
        // Publish new local service
        app.servicePublisher.publish('service', { uuid: app.uuid, path: (0, _commons.stripSlashes)(path) });
        debug('Published local service on path ' + path);
        // Register the responder to handle remote calls to the service
        service.responder = new _service.LocalService({ app: app, path: (0, _commons.stripSlashes)(path) });
      }
    };
  };
}

init.RemoteService = _service.RemoteService;
init.LocalService = _service.LocalService;
module.exports = exports['default'];