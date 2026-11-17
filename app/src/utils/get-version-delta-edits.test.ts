import { describe, expect, test } from 'vitest';
import { getVersionDeltaCreateEdits, getVersionDeltaEdits } from './get-version-delta-edits';

const version = {
	delta: {
		blocks: {
			create: [],
			update: [
				{
					id: '322b8487-9cd6-4e47-9646-8bb6f1764554',
					collection: 'block_trust_bar',
					item: { id: '5702c0e5-f271-4f37-80a1-79719047be1b', title: 'Edited title' },
				},
			],
			delete: [],
		},
	},
};

const createdVersion = {
	delta: {
		blocks: {
			create: [
				{ collection: 'block_trust_bar', item: { title: 'New title' } },
				{ collection: 'block_text', item: { body: 'Other block' } },
			],
			update: [],
			delete: [],
		},
	},
};

const match = {
	collectionField: 'collection',
	collection: 'block_trust_bar',
	junctionPkField: 'id',
	junctionField: 'item',
	relatedPkField: 'id',
};

describe('getVersionDeltaCreateEdits', () => {
	test('returns the values of a block that only exists in the version delta', () => {
		const edits = getVersionDeltaCreateEdits(createdVersion, 'blocks', match);

		expect(edits.item.title).toBe('New title');
		expect(edits.collection).toBe('block_trust_bar');
	});

	test('matches an entry by its related key when it carries one', () => {
		const keyed = {
			delta: {
				blocks: {
					create: [
						{ collection: 'block_trust_bar', item: { id: 1, title: 'First' } },
						{ collection: 'block_trust_bar', item: { id: 2, title: 'Second' } },
					],
				},
			},
		};

		expect(getVersionDeltaCreateEdits(keyed, 'blocks', { ...match, relatedPk: 2 }).item.title).toBe('Second');
	});

	test('returns nothing when the entry cannot be told apart from other created blocks', () => {
		const ambiguous = {
			delta: {
				blocks: {
					create: [
						{ collection: 'block_trust_bar', item: { title: 'First' } },
						{ collection: 'block_trust_bar', item: { title: 'Second' } },
					],
				},
			},
		};

		expect(getVersionDeltaCreateEdits(ambiguous, 'blocks', match)).toEqual({});
	});

	test('returns nothing without a version, a delta, or a created entry', () => {
		expect(getVersionDeltaCreateEdits(null, 'blocks', match)).toEqual({});
		expect(getVersionDeltaCreateEdits({ delta: null }, 'blocks', match)).toEqual({});
		expect(getVersionDeltaCreateEdits(createdVersion, 'other', match)).toEqual({});
		expect(getVersionDeltaCreateEdits(version, 'blocks', match)).toEqual({});
	});
});

describe('getVersionDeltaEdits', () => {
	test('returns the delta entry of an existing item so the form shows the version values', () => {
		const edits = getVersionDeltaEdits(version, 'blocks', 'id', '322b8487-9cd6-4e47-9646-8bb6f1764554');

		expect(edits.item.title).toBe('Edited title');
		expect(edits.collection).toBe('block_trust_bar');
	});

	test('returns a copy that can be changed without touching the version', () => {
		const edits = getVersionDeltaEdits(version, 'blocks', 'id', '322b8487-9cd6-4e47-9646-8bb6f1764554');

		edits.collection = 'other';

		expect(version.delta.blocks.update[0]!.collection).toBe('block_trust_bar');
	});

	test('returns nothing for an item the version does not change', () => {
		expect(getVersionDeltaEdits(version, 'blocks', 'id', 'unknown')).toEqual({});
	});

	test('returns nothing without a version, a delta, or a primary key', () => {
		expect(getVersionDeltaEdits(null, 'blocks', 'id', '1')).toEqual({});
		expect(getVersionDeltaEdits({ delta: null }, 'blocks', 'id', '1')).toEqual({});
		expect(getVersionDeltaEdits(version, 'blocks', 'id', null)).toEqual({});
		expect(getVersionDeltaEdits(version, 'other', 'id', '1')).toEqual({});
	});
});
