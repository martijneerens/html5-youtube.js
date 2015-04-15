window.youtube.bind = function(fn, context) {
	var args = Array.prototype.slice.call(arguments, 2);
	return function() {
		var curArgs = args.concat(Array.prototype.slice.call(arguments));
		return fn.apply(context, curArgs);
	};
};

window.youtube._execDefineProperty = function() {
	var obj = this.prototype;
	var properties = this._undefinedProperties;
	for (var i=0, l=properties.length; i<l; i++) {
		var args = properties[i];
		var prop = args[0];
		var descriptor = args[1];
		obj[prop] = function(value) {
			if (arguments.length > 0) {
				descriptor.set.call(this, value);
				return value;
			}
			else {
				return descriptor.get.call(this);
			}
		};
	}
};
