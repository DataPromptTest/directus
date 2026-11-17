import type { ContentVersion, PrimaryKey } from '@directus/types';

/**
 * Find the entry a content version's delta holds for an existing item of a to-many field.
 * The drawer reads related items straight from their own collection, which knows nothing about
 * the version, so these entries are what carries the version's changes into the form.
 */
export function getVersionDeltaEdits(
	version: Pick<ContentVersion, 'delta'> | null | undefined,
	field: string,
	primaryKeyField: string,
	primaryKey: PrimaryKey | null | undefined,
): Record<string, any> {
	if (!version?.delta || primaryKey === null || primaryKey === undefined) return {};

	const updates = version.delta[field]?.update;
	if (!Array.isArray(updates)) return {};

	const entry = updates.find(
		(update) => typeof update === 'object' && update !== null && String(update[primaryKeyField]) === String(primaryKey),
	);

	return entry ? { ...entry } : {};
}

type CreatedItemMatch = {
	collectionField: string;
	collection: string;
	junctionPkField: string;
	junctionPk?: PrimaryKey | null;
	junctionField: string;
	relatedPkField: string;
	relatedPk?: PrimaryKey | null;
};

/**
 * Find the entry a content version's delta holds for an item that only exists in the version.
 * Such an item has no row in its own collection, so the entry is the only source for the form values.
 * Entries are matched by their junction or related key when they carry one. Without any key to go by,
 * an entry is only used when it is the sole created entry of that collection.
 */
export function getVersionDeltaCreateEdits(
	version: Pick<ContentVersion, 'delta'> | null | undefined,
	field: string,
	match: CreatedItemMatch,
): Record<string, any> {
	const creates = version?.delta?.[field]?.create;
	if (!Array.isArray(creates)) return {};

	const isSame = (a: unknown, b: PrimaryKey) => a !== null && a !== undefined && String(a) === String(b);

	const candidates = creates.filter(
		(create) => typeof create === 'object' && create !== null && create[match.collectionField] === match.collection,
	);

	const { junctionPk, relatedPk } = match;
	const hasJunctionPk = junctionPk !== null && junctionPk !== undefined;
	const hasRelatedPk = relatedPk !== null && relatedPk !== undefined;

	let entry;

	if (hasJunctionPk) entry = candidates.find((create) => isSame(create[match.junctionPkField], junctionPk));

	if (!entry && hasRelatedPk) {
		entry = candidates.find((create) => isSame(create[match.junctionField]?.[match.relatedPkField], relatedPk));
	}

	if (!entry && !hasJunctionPk && !hasRelatedPk && candidates.length === 1) entry = candidates[0];

	return entry ? { ...entry } : {};
}
