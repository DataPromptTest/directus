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
