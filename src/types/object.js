/**
 * @author Michał Żaloudik <ponury.kostek@gmail.com>
 */
"use strict";
const types = require("./index");
const fast = require("fast.js");
const common = require("../common");
const ExtError = require("exterror");
const Promise = require("bluebird");

/**
 *
 * @param model
 * @param target
 * @param set
 * @param schema
 * @param {string} key
 * @param path
 * @param {Object} value
 * @private
 */
function _set(model, target, set, schema, key, path, value) {
	if (!schema.properties || common.isEmpty(schema.properties)) {
		target[key] = set[key] = fast.object.clone(value);
		return Promise.resolve();
	}
	set[key] = {};
	target[key] = {};
	const await = [];
	fast.object.forEach(value, (item, target_key) => {
		if (!schema.properties.hasOwnProperty(target_key)) {
			return await.push(Promise.reject(new ExtError("ERR_KEY_NOT_ALLOWED", "Key '" + target_key + "' in '" + path + "' in not allowed ")));
		}
		const type = schema.properties[target_key].type;
		const item_schema = schema.properties[target_key];
		await.push(common.setTargetItem({
			types,
			model,
			set,
			target,
			target_key,
			item,
			item_schema,
			type,
			key,
			path: path + "." + key,
			value
		}));
	});
	return Promise.all(await);
}

/**
 *
 * @param model
 * @param target
 * @param set
 * @param schema
 * @param key
 * @param path
 * @param value
 * @returns {*}
 */
function set(model, target, set, schema, key, path, value) {
	if (!common.isPlainObject(value)) {
		return Promise.reject(new ExtError("ERR_WRONG_PROPERTY_TYPE", "Expected value of '" + key + "' to be plain object"));
	}
	return _set(model, target, set, schema, key, path, value);
}

module.exports = {
	get: common.modelGet,
	set
};
