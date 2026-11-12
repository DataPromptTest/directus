import { describe, expect, it } from 'vitest';
import { getVersionUpdateEdits } from './get-version-update-edits';

describe('getVersionUpdateEdits', () => {
	const update = [
		{ id: 7, collection: 'page_blocks', item: { id: 3, title: 'Edited title' } },
		{ id: 8, collection: 'page_blocks', item: { id: 4, title: 'Other block' } },
	];

	it('returns the nested item changes of the version entry that matches the row', () => {
		expect(getVersionUpdateEdits(update, 'id', 7, 'item')).toEqual({ id: 3, title: 'Edited title' });
	});

	it('returns the whole entry when no nested field is given', () => {
		expect(getVersionUpdateEdits([{ id: 1, title: 'Edited' }], 'id', 1)).toEqual({ id: 1, title: 'Edited' });
	});

	it('returns nothing when the version has no entry for the row', () => {
		expect(getVersionUpdateEdits(update, 'id', 99, 'item')).toEqual({});
	});

	it('returns nothing without a version delta or without a row key', () => {
		expect(getVersionUpdateEdits(undefined, 'id', 7, 'item')).toEqual({});
		expect(getVersionUpdateEdits(update, 'id', undefined, 'item')).toEqual({});
	});
});
