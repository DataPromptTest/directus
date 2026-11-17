import type { ContentVersion } from '@directus/types';
import { cloneDeep, isPlainObject } from 'lodash-es';

type GetDrawerEditsOptions = {
	/** The content version the parent item is viewed in, `null` outside of a version */
	version: ContentVersion | null;
	/** The block as it is displayed in the list */
	item: Record<string, any>;
	/** The edits staged for the block in the parent value (session edits or the saved delta entry) */
	itemEdits: Record<string, any>;
	/** The value of the relational field on the parent: the saved delta `{ create, update, delete }` or a list of keys */
	value?: unknown;
	collectionField: string;
	junctionField: string;
	junctionPrimaryKeyField: string;
	relationPrimaryKeyField: string;
};

/**
 * The entry of the parent's delta that belongs to the displayed block, if there is one.
 */
function findSavedEntry({
	item,
	value,
	collectionField,
	junctionField,
	junctionPrimaryKeyField,
	relationPrimaryKeyField,
}: Pick<
	GetDrawerEditsOptions,
	'item' | 'value' | 'collectionField' | 'junctionField' | 'junctionPrimaryKeyField' | 'relationPrimaryKeyField'
>): Record<string, any> | undefined {
	if (!isPlainObject(value)) return undefined;

	const delta = value as Record<string, any>;

	if (item.$type === 'created') {
		const created = Array.isArray(delta['create']) ? delta['create'][item.$index] : undefined;
		return isPlainObject(created) ? created : undefined;
	}

	const updates: unknown[] = Array.isArray(delta['update']) ? delta['update'] : [];
	const junctionId = item[junctionPrimaryKeyField];
	const relatedId = item[junctionField]?.[relationPrimaryKeyField];

	return updates.find((entry): entry is Record<string, any> => {
		if (!isPlainObject(entry)) return false;

		const entryItem = entry as Record<string, any>;

		if (junctionId !== undefined && entryItem[junctionPrimaryKeyField] === junctionId) return true;

		return (
			relatedId !== undefined &&
			entryItem[collectionField] === item[collectionField] &&
			entryItem[junctionField]?.[relationPrimaryKeyField] === relatedId
		);
	});
}

/**
 * Initial edits for the drawer of a Builder (M2A) block.
 *
 * The drawer loads the block directly from its own collection, which never carries the changes that
 * a content version saved on the parent. Inside a version the block's entry in the parent's delta
 * (only the fields that were saved, or all values of a block that only exists in the version) is
 * therefore passed on as edits, with the edits staged in the current session on top.
 *
 * Nothing passed in is mutated, the result only holds copies.
 */
export function getDrawerEdits({
	version,
	item,
	itemEdits,
	value,
	collectionField,
	junctionField,
	junctionPrimaryKeyField,
	relationPrimaryKeyField,
}: GetDrawerEditsOptions): Record<string, any> {
	const edits = {
		...cloneDeep(itemEdits),
		[collectionField]: item[collectionField],
	};

	if (version === null) return edits;

	const saved = findSavedEntry({
		item,
		value,
		collectionField,
		junctionField,
		junctionPrimaryKeyField,
		relationPrimaryKeyField,
	});

	if (!saved) return edits;

	const savedValues = isPlainObject(saved[junctionField]) ? saved[junctionField] : {};
	const stagedValues = isPlainObject(edits[junctionField]) ? edits[junctionField] : {};

	return {
		...cloneDeep(saved),
		...edits,
		[junctionField]: { ...cloneDeep(savedValues), ...stagedValues },
	};
}
