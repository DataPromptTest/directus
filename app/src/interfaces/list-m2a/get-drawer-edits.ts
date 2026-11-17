import type { ContentVersion } from '@directus/types';
import { cloneDeep, isPlainObject } from 'lodash-es';

type GetDrawerEditsOptions = {
	/** The content version the parent item is viewed in, `null` outside of a version */
	version: ContentVersion | null;
	/** The block as it is displayed in the list */
	item: Record<string, any>;
	/** The edits staged for the block in the parent value (session edits or the saved delta entry) */
	itemEdits: Record<string, any>;
	collectionField: string;
	junctionField: string;
};

/**
 * Initial edits for the drawer of a Builder (M2A) block.
 *
 * The drawer loads the block directly from its own collection, which never carries the changes that
 * a content version saved on the parent. Inside a version the values of the displayed block (the
 * version's saved changes, or all values of a block that only exists in the version) are therefore
 * passed on as edits, with the edits staged in the current session on top.
 *
 * Nothing passed in is mutated, the result only holds copies.
 */
export function getDrawerEdits({
	version,
	item,
	itemEdits,
	collectionField,
	junctionField,
}: GetDrawerEditsOptions): Record<string, any> {
	const edits = {
		...cloneDeep(itemEdits),
		[collectionField]: item[collectionField],
	};

	if (version === null) return edits;

	const versionValues = item[junctionField];

	if (!isPlainObject(versionValues)) return edits;

	const stagedValues = isPlainObject(edits[junctionField]) ? edits[junctionField] : {};

	edits[junctionField] = { ...cloneDeep(versionValues), ...stagedValues };

	return edits;
}
