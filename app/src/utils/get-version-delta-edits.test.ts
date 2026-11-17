import { describe, expect, test } from 'vitest';
import { getVersionDeltaEdits } from './get-version-delta-edits';

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
