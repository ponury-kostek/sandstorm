/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";
const types = require("./index");
const fast = require("fast.js");
const common = require("../common");
const ExtError = require("exterror");

/**
 *
 * @param model
 * @param target
 * @param set
 * @param schema
 * @param {string} key
 * @param {Array} value
 * @private
 */
function _set(model, target, set, schema, key, value) {
	const length = value.length;
	if (schema.min && length < schema.min) {
		throw new ExtError("ERR_ARRAY_TOO_SHORT");
	}
	if (schema.max && length > schema.max) {
		throw new ExtError("ERR_ARRAY_TOO_LONG");
	}
	const type = schema.item.type;
	if (type === "Mixed") {
		set[key] = target[key] = fast.cloneArray(value);
		return;
	}
	set[key] = [];
	target[key] = [];
	fast.forEach(value, (item, target_key) => {
		const item_schema = schema.item;
		common.setTargetItem({
			types,
			model,
			set,
			target,
			target_key,
			item,
			item_schema,
			type,
			key,
			value
		});
	});
}

/**
 *
 * @param model
 * @param target
 * @param set
 * @param schema
 * @param key
 * @param value
 * @returns {*}
 */
function set(model, target, set, schema, key, value) {
	if (!(value instanceof Array)) {
		throw new ExtError("ERR_WRONG_PROPERTY_TYPE", "Expected value of '" + key + "' to be instance of Array, got " + typeof value);
	}
	_set(model, target, set, schema, key, value);
}

module.exports = {
	get: common.modelGet,
	set
};
