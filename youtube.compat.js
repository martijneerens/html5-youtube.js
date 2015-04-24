(function(window, document, Player) {
	// via Osteoporosis.js
	// https://github.com/ginpei/Osteoporosis.js/blob/ccf3380fef9f8fd850c44fa017ad863af2ddb9b7/osteoporosis.js#L32-L69
	var S__LISTENERS = '_listeners';
	var slice = [].slice;
	var eventPrototype = {
		/**
		 * Binds `listener` to this object as a callback function.
		 * FYI: `off()` is not provided.
		 * @param {String} type
		 * @param {Function} listener
		 */
		on: function(type, listener) {
			var allListeners = this[S__LISTENERS];
			if (!allListeners) {
				allListeners = this[S__LISTENERS] = {};
			}

			var listeners = allListeners[type];
			if (!listeners) {
				listeners = allListeners[type] = [];
			}

			listeners.push(listener);
		},

		/**
		 * Fires an event named `type`.
		 * @param {String} type
		 */
		trigger: function(type) {
			var allListeners = this[S__LISTENERS];
			if (allListeners && allListeners[type]) {
				var args = slice.call(arguments, 1);
				var listeners = allListeners[type];
				for (var i=0, l=listeners.length; i<l; i++) {
					listeners[i].apply(null, args);
				}
			}
		}
	};

	Player.bind = function(fn, context) {
		var args = Array.prototype.slice.call(arguments, 2);
		return function() {
			var curArgs = args.concat(Array.prototype.slice.call(arguments));
			return fn.apply(context, curArgs);
		};
	};

	Player._execDefineProperty = function(obj, prop, descriptor) {
		obj[prop] = function(value) {
			if (arguments.length > 0) {
				descriptor.set.call(this, value);
				return value;
			}
			else {
				return descriptor.get.call(this);
			}
		};
	};

	Player.registerYouTubePlayerReady = function(playerId, player) {
		if (!window.onYouTubePlayerReady) {
			window.onYouTubePlayerReady = this.bind(this.onYouTubePlayerReady, this);
			this._callbacksForYouTubePlayerReady = {};
		}
		this._callbacksForYouTubePlayerReady[playerId] = player;
	};

	Player.onYouTubePlayerReady = function(playerId) {
		var player = this._callbacksForYouTubePlayerReady[playerId];
		player.onYouTubePlayerReady(playerId);
	};

	var prototype = Player.prototype;

	prototype._initializeEventer = function() {
		this._eventer = { on:eventPrototype.on, trigger:eventPrototype.trigger };
	};

	prototype._buildPlayer = function(options) {
		var videoOptions = this._getVideoOptions(options);

		if (!window.swfobject) {
			throw new Error('swfobject is required. Use this code:\n<script src="//cdnjs.cloudflare.com/ajax/libs/swfobject/2.2/swfobject.js"></script>');
		}

		// set up ID
		var playerId = videoOptions.el.id;
		if (!playerId) {
			playerId = vieoOptions.el.id = 'youtubejs' + Date.now();
		}

		// callback
		Player.registerYouTubePlayerReady(playerId, this);

		// load
		// `fs=0` is required because fullscreen button does not work (OMG)
		var url = 'http://www.youtube.com/v/' + videoOptions.videoId +
			'?wmode=opaque&fs=0&enablejsapi=1&version=3&playerapiid=' + playerId;
		var params = { allowScriptAccess:'always',  wmode:'transparent' };
		var attr = { id:playerId };
		swfobject.embedSWF(url, playerId, videoOptions.width, videoOptions.height, '8', null, null, params, attr);
	};

	prototype.onYouTubePlayerReady = function(playerId) {
		var player = this.player = document.getElementById(playerId);

		var prefix = playerId.replace(/-/g, '_');
		this._registerVideoEvents(player, prefix);

		var event = { type:'onReady', data:null, target:player };
		this.onReady(event);
	};

	prototype._registerVideoEvents = function(player, prefix) {
		this._registerVideoEvent(player, prefix, 'onApiChang');
		this._registerVideoEvent(player, prefix, 'onError');
		this._registerVideoEvent(player, prefix, 'onPlaybackQualityChange');
		this._registerVideoEvent(player, prefix, 'onPlaybackRateChange');
		this._registerVideoEvent(player, prefix, 'onReady');
		this._registerVideoEvent(player, prefix, 'onStateChange');
	};

	prototype._registerVideoEvent = function(player, prefix, type) {
		var callbackName = prefix + type;
		player.addEventListener(type, callbackName);
		window[callbackName] = Player.bind(function(type, data) {
			try {  // error will be wasted by swf
				var event = { type:type, data:data, target:this };
				this[type](event);
			}
			catch (error) {
				console.error(error);
			}
		}, this, type);
	};

	prototype.on = function(type, listener) {
		this._eventer.on(type, Player.bind(listener, this));
		return this;
	};

	prototype.trigger = function(type, originalEvent) {
		var event;

		if (document.createEvent) {
			event = document.createEvent('CustomEvent');
			event.initEvent(type, false, true);
		}
		else {
			event = document.createEventObject();
			event.type = type;
		}
		event.player = this;

		if (originalEvent) {
			event.playerData = originalEvent.data;
			event.originalEvent = originalEvent;
		}

		this._eventer.trigger(type, event);
		return this;
	};
})(window, document, window.youtube.Player);
