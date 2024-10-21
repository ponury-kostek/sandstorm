/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";

/**
 *
 * @param options
 * @constructor
 */
function ObjectIdProperty(options) {
	this.type = "ObjectId";
	this.coerce = options.coerce === undefined ? true : options.coerce;
	this.required = options.required || false;
	this.unique = options.unique || false;
	this.default = options.default;
}

module.exports = ObjectIdProperty;
