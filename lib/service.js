'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cote = require('cote');

var _cote2 = _interopRequireDefault(_cote);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('feathers-distributed:service');

// This is the Feathers service abstraction for a cote requester on remote

var RemoteService = function () {
  function RemoteService(options) {
    _classCallCheck(this, RemoteService);

    // This flag indicates to the plugin this is a remote service
    this.remote = true;
  }

  _createClass(RemoteService, [{
    key: 'setup',
    value: function setup(app, path) {
      var _this = this;

      // Create the request manager to remote ones for this service
      this.requester = new _cote2.default.Requester({
        name: path + ' requester',
        namespace: path,
        requests: ['find', 'get', 'create', 'update', 'patch', 'remove']
      }, { log: false });
      this.path = path;
      debug('Requester created for remote service on path ' + this.path);
      // Create the subscriber to listen to events from other nodes
      this.serviceEventsSubscriber = new _cote2.default.Subscriber({
        name: path + ' events subscriber',
        namespace: path,
        subscribesTo: ['created', 'updated', 'patched', 'removed']
      }, { log: false });
      this.serviceEventsSubscriber.on('created', function (object) {
        _this.emit('created', object);
      });
      this.serviceEventsSubscriber.on('updated', function (object) {
        _this.emit('updated', object);
      });
      this.serviceEventsSubscriber.on('patched', function (object) {
        _this.emit('patched', object);
      });
      this.serviceEventsSubscriber.on('removed', function (object) {
        _this.emit('removed', object);
      });
      debug('Subscriber created for remote service events on path ' + this.path);
    }

    // Perform requests to other nodes

  }, {
    key: 'find',
    value: function find(params) {
      var _this2 = this;

      debug('Requesting find() remote service on path ' + this.path, params);
      return this.requester.send({ type: 'find', params: params }).then(function (result) {
        debug('Successfully find() remote service on path ' + _this2.path);
        return result;
      });
    }
  }, {
    key: 'get',
    value: function get(id, params) {
      var _this3 = this;

      debug('Requesting get() remote service on path ' + this.path, id, params);
      return this.requester.send({ type: 'get', id: id, params: params }).then(function (result) {
        debug('Successfully get() remote service on path ' + _this3.path);
        return result;
      });
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      var _this4 = this;

      debug('Requesting create() remote service on path ' + this.path, data, params);
      return this.requester.send({ type: 'create', data: data, params: params }).then(function (result) {
        debug('Successfully create() remote service on path ' + _this4.path);
        return result;
      });
    }
  }, {
    key: 'update',
    value: function update(id, data, params) {
      var _this5 = this;

      debug('Requesting update() remote service on path ' + this.path, id, data, params);
      return this.requester.send({ type: 'update', id: id, data: data, params: params }).then(function (result) {
        debug('Successfully update() remote service on path ' + _this5.path);
        return result;
      });
    }
  }, {
    key: 'patch',
    value: function patch(id, data, params) {
      var _this6 = this;

      debug('Requesting patch() remote service on path ' + this.path, id, data, params);
      return this.requester.send({ type: 'patch', id: id, data: data, params: params }).then(function (result) {
        debug('Successfully patch() remote service on path ' + _this6.path);
        return result;
      });
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this7 = this;

      debug('Requesting remove() remote service on path ' + this.path, id, params);
      return this.requester.send({ type: 'remove', id: id, params: params }).then(function (result) {
        debug('Successfully remove() remote service on path ' + _this7.path);
        return result;
      });
    }
  }]);

  return RemoteService;
}();

// This is the cote responder abstraction for a local Feathers service


var LocalService = function (_cote$Responder) {
  _inherits(LocalService, _cote$Responder);

  function LocalService(options) {
    _classCallCheck(this, LocalService);

    var app = options.app;
    var path = options.path;

    var _this8 = _possibleConstructorReturn(this, (LocalService.__proto__ || Object.getPrototypeOf(LocalService)).call(this, { name: path + ' responder', namespace: path, respondsTo: ['find', 'get', 'create', 'update', 'patch', 'remove'] }, { log: false }));

    debug('Responder created for local service on path ' + path);
    var service = app.service(path);

    // Answer requests from other nodes
    _this8.on('find', function (req) {
      debug('Responding find() local service on path ' + path);
      return service.find(req.params).then(function (result) {
        debug('Successfully find() local service on path ' + path);
        return result;
      });
    });
    _this8.on('get', function (req) {
      debug('Responding get() local service on path ' + path);
      return service.get(req.id, req.params).then(function (result) {
        debug('Successfully get() local service on path ' + path);
        return result;
      });
    });
    _this8.on('create', function (req) {
      debug('Responding create() local service on path ' + path);
      return service.create(req.data, req.params).then(function (result) {
        debug('Successfully create() local service on path ' + path);
        return result;
      });
    });
    _this8.on('update', function (req) {
      debug('Responding update() local service on path ' + path);
      return service.update(req.id, req.data, req.params).then(function (result) {
        debug('Successfully update() local service on path ' + path);
        return result;
      });
    });
    _this8.on('patch', function (req) {
      debug('Responding patch() local service on path ' + path);
      return service.patch(req.id, req.data, req.params).then(function (result) {
        debug('Successfully patch() local service on path ' + path);
        return result;
      });
    });
    _this8.on('remove', function (req) {
      debug('Responding remove() local service on path ' + path);
      return service.remove(req.id, req.params).then(function (result) {
        debug('Successfully remove() local service on path ' + path);
        return result;
      });
    });

    // Dispatch events to other nodes
    _this8.serviceEventsPublisher = new _cote2.default.Publisher({
      name: path + ' events publisher',
      namespace: path,
      broadcasts: ['created', 'updated', 'patched', 'removed']
    }, { log: false });
    service.on('created', function (object) {
      _this8.serviceEventsPublisher.publish('created', object);
    });
    service.on('updated', function (object) {
      _this8.serviceEventsPublisher.publish('updated', object);
    });
    service.on('patched', function (object) {
      _this8.serviceEventsPublisher.publish('patched', object);
    });
    service.on('removed', function (object) {
      _this8.serviceEventsPublisher.publish('removed', object);
    });
    debug('Publisher created for local service events on path ' + path);
    return _this8;
  }

  return LocalService;
}(_cote2.default.Responder);

exports.default = {
  RemoteService: RemoteService,
  LocalService: LocalService
};
module.exports = exports['default'];