import type { ContentVersion } from '@directus/types';
import { cloneDeep } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { getDrawerEdits } from './get-drawer-edits';

const version = { id: 'version-1', key: 'draft' } as ContentVersion;

const fields = {
	collectionField: 'collection',
	junctionField: 'item',
	junctionPrimaryKeyField: 'id',
	relationPrimaryKeyField: 'id',
};

// The block as the list shows it after the version was saved and the page reloaded: it comes from the
// published rows, the version's changes only exist in the parent's delta
const publishedBlock = {
	id: 322,
	collection: 'block_trust_bar',
	item: { id: 'block-1', title: 'Original title', subtitle: 'Original subtitle' },
};

const savedDelta = {
	create: [{ collection: 'block_trust_bar', item: { title: 'Created in version' } }],
	update: [{ id: 322, collection: 'block_trust_bar', item: { id: 'block-1', title: 'Edited title' } }],
	delete: [],
};

describe('getDrawerEdits', () => {
	test('uses the changes saved in the version delta for an existing block', () => {
		const edits = getDrawerEdits({
			version,
			item: publishedBlock,
			itemEdits: {},
			value: savedDelta,
			...fields,
		});

		expect(edits['item']['title']).toBe('Edited title');
		expect(edits['collection']).toBe('block_trust_bar');
	});

	test('only holds the fields of the delta, not the other published values', () => {
		const edits = getDrawerEdits({
			version,
			item: publishedBlock,
			itemEdits: {},
			value: savedDelta,
			...fields,
		});

		expect(edits['item']).toEqual({ id: 'block-1', title: 'Edited title' });
		expect(edits['item']).not.toHaveProperty('subtitle');
	});

	test('opens a block that only exists in the version with its delta values', () => {
		const createdBlock = {
			collection: 'block_trust_bar',
			item: { title: 'Created in version' },
			$type: 'created',
			$index: 0,
		};

		const edits = getDrawerEdits({
			version,
			item: createdBlock,
			itemEdits: { collection: 'block_trust_bar', item: { title: 'Created in version' }, $type: 'created', $index: 0 },
			value: savedDelta,
			...fields,
		});

		expect(edits['item']).toEqual({ title: 'Created in version' });
		expect(edits['collection']).toBe('block_trust_bar');
	});

	test('fills in a created block from the delta when nothing was staged for it', () => {
		const createdBlock = { collection: 'block_trust_bar', item: {}, $type: 'created', $index: 0 };

		const edits = getDrawerEdits({
			version,
			item: createdBlock,
			itemEdits: {},
			value: savedDelta,
			...fields,
		});

		expect(edits['item']).toEqual({ title: 'Created in version' });
	});

	test('lets edits of the current session win over the delta', () => {
		const edits = getDrawerEdits({
			version,
			item: publishedBlock,
			itemEdits: { id: 322, item: { id: 'block-1', title: 'Typed just now' }, $type: 'updated', $index: 0 },
			value: savedDelta,
			...fields,
		});

		expect(edits['item']['title']).toBe('Typed just now');
		expect(edits['$type']).toBe('updated');
	});

	test('does not mutate the published block, the delta or the staged edits', () => {
		const block = cloneDeep(publishedBlock);
		const delta = cloneDeep(savedDelta);
		const staged = { id: 322, item: { id: 'block-1', note: 'staged' } };
		const stagedBefore = cloneDeep(staged);

		const edits = getDrawerEdits({ version, item: block, itemEdits: staged, value: delta, ...fields });

		edits['item']['title'] = 'changed afterwards';

		expect(block).toEqual(publishedBlock);
		expect(delta).toEqual(savedDelta);
		expect(staged).toEqual(stagedBefore);
	});

	test('returns the staged edits and the collection when the block has no entry in the delta', () => {
		const edits = getDrawerEdits({
			version,
			item: { ...publishedBlock, id: 999, item: { id: 'block-9', title: 'Other' } },
			itemEdits: {},
			value: savedDelta,
			...fields,
		});

		expect(edits).toEqual({ collection: 'block_trust_bar' });
	});

	test('ignores the value when it is a list of keys instead of a delta', () => {
		const edits = getDrawerEdits({ version, item: publishedBlock, itemEdits: {}, value: [322], ...fields });

		expect(edits).toEqual({ collection: 'block_trust_bar' });
	});

	test('does not look at the delta outside of a version', () => {
		const staged = { id: 322, item: { id: 'block-1', title: 'Typed just now' }, $type: 'updated', $index: 0 };

		const edits = getDrawerEdits({
			version: null,
			item: publishedBlock,
			itemEdits: staged,
			value: savedDelta,
			...fields,
		});

		expect(edits).toEqual({ ...staged, collection: 'block_trust_bar' });
	});

	test('does not add anything for an untouched block outside of a version', () => {
		const edits = getDrawerEdits({ version: null, item: publishedBlock, itemEdits: {}, value: savedDelta, ...fields });

		expect(edits).toEqual({ collection: 'block_trust_bar' });
	});
});
