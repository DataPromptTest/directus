/**
 * Returns the values a content version changed for one relational row, so a drawer opened for that row inside
 * the version starts from them. Only the fields present in the version's entry are returned, not the whole row.
 *
 * @param update The `update` list of the version's ChangesItem delta for the relational field
 * @param matchField The field on each entry that identifies the row (the junction primary key for M2A and M2M)
 * @param matchValue The identifier of the row being opened
 * @param nestedField The field holding the related item's changes on the entry (`item` for M2A junctions)
 */
export function getVersionUpdateEdits(
	update: Record<string, any>[] | null | undefined,
	matchField: string,
	matchValue: string | number | null | undefined,
	nestedField?: string,
): Record<string, any> {
	if (!update || matchValue === null || matchValue === undefined) return {};

	const entry = update.find((entry) => entry[matchField] === matchValue);
	if (!entry) return {};

	const changes = nestedField ? entry[nestedField] : entry;
	return changes ? { ...changes } : {};
}
