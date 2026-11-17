import type { ContentVersion } from '@directus/types';
import { cloneDeep } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { getDrawerEdits } from './get-drawer-edits';

const version = { id: 'version-1', key: 'draft' } as ContentVersion;

const collectionField = 'collection';
const junctionField = 'item';

describe('getDrawerEdits', () => {
	test('uses the changes saved in the version for an existing block', () => {
		const displayedBlock = {
			id: 322,
			collection: 'block_trust_bar',
			item: { id: 'block-1', title: 'Edited title' },
		};

		const edits = getDrawerEdits({
			version,
			item: displayedBlock,
			itemEdits: {},
			collectionField,
			junctionField,
		});

		expect(edits).toEqual({
			collection: 'block_trust_bar',
			item: { id: 'block-1', title: 'Edited title' },
		});
	});

	test('fills in the values of a block that only exists in the version', () => {
		const savedBlock = {
			collection: 'block_trust_bar',
			item: { title: 'Created in version' },
			$type: 'created',
			$index: 0,
		};

		const edits = getDrawerEdits({
			version,
			item: savedBlock,
			itemEdits: { collection: 'block_trust_bar', item: { title: 'Created in version' }, $type: 'created', $index: 0 },
			collectionField,
			junctionField,
		});

		expect(edits.item).toEqual({ title: 'Created in version' });
		expect(edits.collection).toBe('block_trust_bar');
	});

	test('lets edits of the current session win over the saved values', () => {
		const edits = getDrawerEdits({
			version,
			item: {
				id: 322,
				collection: 'block_trust_bar',
				item: { id: 'block-1', title: 'Edited title', subtitle: 'Saved' },
			},
			itemEdits: { id: 322, item: { id: 'block-1', title: 'Edited again' }, $type: 'updated', $index: 0 },
			collectionField,
			junctionField,
		});

		expect(edits.item).toEqual({ id: 'block-1', title: 'Edited again', subtitle: 'Saved' });
		expect(edits.$type).toBe('updated');
	});

	test('does not mutate the displayed block or the staged edits', () => {
		const displayedBlock = {
			id: 322,
			collection: 'block_trust_bar',
			item: { id: 'block-1', title: 'Edited title', nested: { a: 1 } },
		};

		const stagedEdits = { id: 322, item: { id: 'block-1', title: 'Edited again' }, $type: 'updated', $index: 0 };

		const displayedBefore = cloneDeep(displayedBlock);
		const stagedBefore = cloneDeep(stagedEdits);

		const edits = getDrawerEdits({
			version,
			item: displayedBlock,
			itemEdits: stagedEdits,
			collectionField,
			junctionField,
		});

		edits.item.nested.a = 2;
		edits.item.title = 'Changed afterwards';

		expect(displayedBlock).toEqual(displayedBefore);
		expect(stagedEdits).toEqual(stagedBefore);
	});

	test('keeps the previous result outside of a version', () => {
		const displayedBlock = {
			id: 322,
			collection: 'block_trust_bar',
			item: { id: 'block-1', title: 'Published title' },
		};

		expect(
			getDrawerEdits({ version: null, item: displayedBlock, itemEdits: {}, collectionField, junctionField }),
		).toEqual({
			collection: 'block_trust_bar',
		});

		const stagedEdits = { id: 322, item: { id: 'block-1', title: 'Edited' }, $type: 'updated', $index: 0 };

		expect(
			getDrawerEdits({ version: null, item: displayedBlock, itemEdits: stagedEdits, collectionField, junctionField }),
		).toEqual({ ...stagedEdits, collection: 'block_trust_bar' });
	});
});
