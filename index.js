const Promise = require('bluebird');
const buildWhere = (object, where) => {
	if (where.op === '==') {
		return object.where(`${where.field}`, `${where.value}`);
	}
	if (where.op === '!=' || where.op === '<>' || where.op === '<' || where.op === '>' || where.op === 'like') {
		return object.where(`${where.field}`, `${where.op}`, `${where.value}`);
	}
	if (where.op === 'null') {
		return object.whereNull(`${where.field}`);
	}
	if (where.op === 'notNull') {
		return object.whereNotNull(`${where.field}`);
	}
	if (where.op === 'between') {
		return object.whereBetween(`${where.field}`, where.value);
	}
	if (where.op === 'notBetween') {
		return object.whereNotBetween(`${where.field}`, where.value);
	}
	if (where.op === 'in') {
		return object.whereIn(`${where.field}`, where.value);
	}
	if (where.op === 'notIn') {
		return object.whereNotIn(`${where.field}`, where.value);
	}
	if (where.op === 'not') {
		return object.whereNot(where.value);
	}
};

const buildOrderBy = function(object, o) {
	return object.orderBy(`${o.field}`, `${o.hasOwnProperty('direction') ? o.direction : 'ASC'}`);
};

exports.run = async function(model, query) {
	var baseQuery = model.query();
	var queryOptions = query;
	if (queryOptions.hasOwnProperty('fields')) {
		for (var f of queryOptions.fields) {
			baseQuery.select(`${f}`);
		}
	}

	if (queryOptions.hasOwnProperty('order')) {
		for (var o of queryOptions.order) {
			buildOrderBy(baseQuery, o);
		}
	}

	if (queryOptions.hasOwnProperty('where')) {
		for (var w of queryOptions.where) {
			buildWhere(baseQuery, w);
		}
	}

	if (queryOptions.hasOwnProperty('with')) {
		await Promise.each(queryOptions.with, (w) => {
			return baseQuery
				.with(`${w.table}`, (builder) => {
					if (w.hasOwnProperty('fields')) {
						builder.select(w.fields);
					}

					if (w.hasOwnProperty('where')) {
						for (var v of w.where) {
							buildWhere(builder, v);
						}
					}

					if (w.hasOwnProperty('order')) {
						for (var o of w.order) {
							buildOrderBy(builder, o);
						}
					}
				})
				.fetch();
		});
	}

	if (queryOptions.hasOwnProperty('withCount')) {
		for (var c of queryOptions.withCount) {
			baseQuery.withCount(`${c.table}`);
		}
	}

	if (queryOptions.hasOwnProperty('limit')) {
		baseQuery.limit(queryOptions.limit.qty);
	}

	if (queryOptions.hasOwnProperty('paginate')) {
		return await baseQuery.paginate(queryOptions.paginate.page, queryOptions.paginate.perPage || 20);
	} else if (queryOptions.hasOwnProperty('aggregate')) {
		return await baseQuery[`${queryOptions.aggregate.function}`](`${queryOptions.aggregate.field}`);
	} else {
		return await baseQuery.fetch();
	}
};
