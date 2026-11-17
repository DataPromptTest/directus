import { isPlainObject } from 'lodash-es';

/**
 * Lay the parent's delta entry for an item over the values fetched for it.
 *
 * A related item opened from a relational interface is requested directly, without the version of the parent it
 * belongs to. The values saved in the version only live in the parent's delta (e.g. `blocks.update[].item`), so
 * without this the published values would be shown instead of the version's.
 *
 * @param values Values returned by the request for the item
 * @param delta The parent's delta entry for the item
 * @param junctionField Field of the delta entry that holds the nested related item, merged one level deep
 */
export function applyVersionDelta(
	values: Record<string, any> | null | undefined,
	delta: Record<string, any> | null | undefined,
	junctionField?: string | null,
): Record<string, any> | null {
	if (!isPlainObject(delta)) return values ?? null;

	const result: Record<string, any> = { ...(values ?? {}) };

	for (const [key, value] of Object.entries(delta!)) {
		// Display helpers of the parent such as `$type` and `$index` aren't item values
		if (key.startsWith('$')) continue;

		if (junctionField && key === junctionField && isPlainObject(value)) {
			result[key] = { ...(isPlainObject(result[key]) ? result[key] : {}), ...value };
		} else {
			result[key] = value;
		}
	}

	return result;
}
