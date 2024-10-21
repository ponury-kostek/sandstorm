"use strict";
/**
 * @ignore
 */
const assert = require("assert");
const {
	ObjectId,
	MongoClient
} = require("mongodb");
/**
 *
 * @type {Sandstorm}
 */
const Orm = require("../");
describe("Model", () => {
	describe("set", () => {
		const orm = new Orm();
		orm.register("Set", {name: "String"});
		it("not existing prop", (done) => {
			const model = orm.create("Set");
			model.set({notExisting: "key"}).then(() => done(new Error("Exception expected"))).catch(() => done());
		});
	});
	it("toJSON", () => {
		const orm = new Orm();
		orm.register("ToJson", {name: "String"});
		const model = orm.create("ToJson");
		model.set({name: "key"});
		assert.strictEqual(model.toJSON(), model.data);
	});
	describe("base", () => {
		const orm = new Orm();
		let _db = null;
		before((done) => {
			orm.Schema.register("Base", {
				_id: "String",
				array: "Array",
				bool: "Boolean",
				date: "Date",
				mix: "Mixed",
				number: "Number",
				object: "Object",
				objId: "ObjectId",
				string: "String"
			});
			orm.connect("mongodb://root:root@localhost/admin").then(() => {
				return orm.use("sandstorm_test_model_base");
			}).then((db) => {
				_db = db;
				return _db.dropDatabase();
			}).then(() => {
				done();
			}).catch(done);
		});
		after((done) => {
			orm.disconnect().then(() => {
				done();
			}).catch(done);
		});
		it("set + merge", function (done) {
			const model = orm.create("Base");
			const date = new Date();
			const objId = new ObjectId();
			model.set({
				_id: "Klucz",
				array: [
					1,
					"a",
					false,
					{a: 2}
				],
				bool: true,
				date: date,
				mix: "Mixed",
				number: 1.23,
				object: {
					a: 1,
					b: true
				},
				objId: objId,
				string: "String"
			}).then((model) => {
				return model.save();
			}).then(async () => {
				const _doc = await _db.collection("Base").findOne({_id: model.data._id});
				assert.deepStrictEqual(_doc, {
					_id: model.data._id,
					array: [
						1,
						"a",
						false,
						{a: 2}
					],
					bool: true,
					date: date,
					mix: "Mixed",
					number: 1.23,
					object: {
						a: 1,
						b: true
					},
					objId: objId,
					string: "String"
				});
				return model.set({
					object: {b: false},
					array: [
						1,
						"a",
						true
					]
				}).then(model => model.save());
			}).then(async () => {
				const _doc = await _db.collection("Base").findOne({_id: model.data._id});
				assert.deepStrictEqual(_doc, {
					_id: "Klucz",
					object: {b: false},
					array: [
						1,
						"a",
						true
					]
				});
				return model.merge({
					object: {c: 3}
				}).then(model => model.save());
			}).then(async () => {
				let _doc = await _db.collection("Base").findOne({_id: model.data._id});
				assert.deepStrictEqual(_doc, {
					_id: "Klucz",
					object: {
						b: false,
						c: 3
					},
					array: [
						1,
						"a",
						true
					]
				});
				const cursor = orm.find("Base", {});
				assert.strictEqual(await cursor.count(), 1);
				let doc = await cursor.toArray();
				doc = doc.pop();
				_doc = await _db.collection("Base").findOne({_id: doc.data._id});
				assert.deepStrictEqual(doc.data, _doc);
				assert.deepStrictEqual(doc.data, doc.get());
				const get = await orm.get("Base", doc.data._id);
				done();
			}).catch(done);
		});
		it("delete", function (done) {
			orm.register("Delete", {name: "String"});
			const model = orm.create("Delete", {name: "test"});
			let _id = null;
			model.save().then(async () => {
				_id = new ObjectId(model.data._id);
				const _doc = await _db.collection("Delete").findOne({_id});
				assert.deepStrictEqual(_doc, {
					_id: model.data._id,
					name: "test"
				});
				return model.delete();
			}).then(async () => {
				const _doc = await _db.collection("Delete").findOne({_id});
				assert(_doc === null);
				done();
			}).catch(done);
		});
	});
	describe("embed", () => {
		let _db = null;
		const orm = new Orm();
		before((done) => {
			orm.connect("mongodb://root:root@localhost/admin").then(() => {
				return orm.use("sandstorm_test_model_embed");
			}).then((db) => {
				_db = db;
				return _db.dropDatabase();
			}).then(() => {
				orm.register("Embed2", {
					name: "String",
					value: "String"
				});
				orm.register("Embed", {
					name: "String",
					value: "String",
					arr: {
						type: "Array",
						item: {
							type: "Object",
							properties: {
								a: "String",
								b: "Embed2"
							}
						}
					}
				});
				orm.Schema.register("Base", {
					array: [
						{
							item: [
								{
									type: "Embed",
									embed: ["name"]
								}
							]
						}
					],
					embed: {
						type: "Embed"
					},
					object: {
						array: [
							{
								type: "Embed",
								embed: ["name"]
							}
						],
						embed: {
							type: "Embed",
							embed: ["name"]
						}
					}
				});
				done();
			}).catch(done);
		});
		after((done) => {
			orm.disconnect().then(() => {
				done();
			}).catch(done);
		});
		it("base set 2", async function () {
			const model = orm.create("Base");
			await model.set({
				embed: {
					arr: [
						{a: "adad"}
					]
				}
			});
			const _id = await model.save();
			/*const data = (await orm.findOne("Base", {_id})).get({dry:true});
			console.dir(data, {
				depth: 5,
				colors: true
			});*/
		});
		it("base set", async function () {
			const model = orm.create("Base");
			await model.set({
				array: [
					{
						item: [
							{
								name: "in_array",
								value: "don't embed this"
							}
						]
					}
				],
				object: {
					array: [
						{
							name: "in_object_array",
							value: "don't embed this"
						}
					],
					embed: {
						name: "in_object",
						value: "don't embed this"
					}
				},
				embed: {
					name: "in_root",
					value: "don't embed this"
				}
			});
			await model.save();
			let _doc = await _db.collection("Base").findOne({_id: new ObjectId(model.data._id)});
			assert(_doc.array instanceof Array);
			assert(_doc.array.length === 1);
			assert(_doc.array[0].item.length === 1);
			assert(_doc.array[0].item[0]._id instanceof ObjectId);
			assert(_doc.array[0].item[0].name === "in_array");
			assert(_doc.object.array instanceof Array);
			assert(_doc.object.array.length === 1);
			assert(_doc.object.array[0]._id instanceof ObjectId);
			assert(_doc.object.array[0].name === "in_object_array");
			assert(_doc.object.embed._id instanceof ObjectId);
			assert(_doc.object.embed.name === "in_object");
			assert(_doc.embed._id instanceof ObjectId);
			const embed = await orm.get("Embed", _doc.object.array[0]._id);
			await embed.merge({name: "updated"});
			await embed.save();
		});
		it("base merge", async function () {
			const _embed = orm.create("Embed");
			await _embed.set({
				name: "in_root",
				value: "don't embed this"
			});
			await _embed.save();
			const _embed_in_oa = orm.create("Embed");
			await _embed_in_oa.merge({
				name: "in_object_array",
				value: "don't embed this"
			});
			const model = orm.create("Base");
			await model.merge({
				array: [
					{
						item: [
							{
								name: "in_array",
								value: "don't embed this"
							}
						]
					}
				],
				object: {
					array: [
						_embed_in_oa
					],
					embed: {
						name: "in_object",
						value: "don't embed this"
					}
				},
				embed: _embed
			});
			await model.save();
			let _doc = await _db.collection("Base").findOne({_id: new ObjectId(model.data._id)});
			assert(_doc.array instanceof Array);
			assert(_doc.array.length === 1);
			assert(_doc.array[0].item.length === 1);
			assert(_doc.array[0].item[0]._id instanceof ObjectId);
			assert(_doc.array[0].item[0].name === "in_array");
			assert(_doc.object.array instanceof Array);
			assert(_doc.object.array.length === 1);
			assert(_doc.object.array[0]._id instanceof ObjectId);
			assert(_doc.object.array[0].name === "in_object_array");
			assert(_doc.object.embed._id instanceof ObjectId);
			assert(_doc.object.embed.name === "in_object");
			assert(_doc.embed._id instanceof ObjectId);
			const embed = await orm.get("Embed", _doc.object.array[0]._id);
			await embed.merge({name: "updated"});
			await embed.save();
			await model.merge({embed: {name: "embed updated"}});
			await model.save();
		});
		it("deep merge", async function () {
			orm.register("DeepMerge", {
				o: {
					a: "String",
					b: {
						type: "String",
						required: true
					},
					c: {
						o: {
							o: {
								a: "String",
								b: {
									type: "String",
									required: true
								}
							}
						}
					}
				}
			});
			let model = orm.create("DeepMerge");
			await model.set({
				o: {
					b: "b",
					c: {o: {o: {b: "b"}}}
				}
			});
			const _id = await model.save();
			model = await orm.get("DeepMerge", _id);
			await model.merge({
				o: {
					a: "a",
					c: {o: {o: {a: "a"}}}
				}
			});
			await model.save();
		});
		it("base set +", async function () {
			const _embed = orm.create("Embed");
			await _embed.set({
				name: "embed",
				value: "don't embed this"
			});
			await _embed.save();
			const model = orm.create("Base");
			await model.merge({
				array: [
					{
						item: [
							_embed,
							_embed
						]
					}
				],
				object: {
					array: [
						_embed
					],
					embed: _embed
				},
				embed: _embed
			});
			await model.save();
			let _doc = await _db.collection("Base").findOne({_id: new ObjectId(model.data._id)});
			assert(_doc.array instanceof Array);
			assert(_doc.array.length === 1);
			assert(_doc.array[0].item.length === 2);
			assert(_doc.array[0].item[0]._id instanceof ObjectId);
			assert(_doc.array[0].item[0].name === "embed");
			assert(_doc.array[0].item[1]._id instanceof ObjectId);
			assert(_doc.array[0].item[1].name === "embed");
			assert(_doc.object.array instanceof Array);
			assert(_doc.object.array.length === 1);
			assert(_doc.object.array[0]._id instanceof ObjectId);
			assert(_doc.object.array[0].name === "embed");
			assert(_doc.object.embed._id instanceof ObjectId);
			assert(_doc.object.embed.name === "embed");
			assert(_doc.embed._id instanceof ObjectId);
			const embed = await orm.get("Embed", _doc.object.array[0]._id);
			await embed.merge({name: "updated"});
			await embed.save();
			await model.merge({embed: {name: "embed updated"}});
			await model.save();
		});
	});
});
