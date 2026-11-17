import { describe, expect, test } from 'vitest';
import { applyVersionDelta } from './apply-version-delta';

describe('applyVersionDelta', () => {
	test('returns the fetched values when there is no delta entry', () => {
		const values = { id: 1, title: 'Original title' };

		expect(applyVersionDelta(values, undefined)).toEqual(values);
		expect(applyVersionDelta(values, null)).toEqual(values);
		expect(applyVersionDelta(null, null)).toBeNull();
	});

	test('shows the version values of the related item instead of the published ones', () => {
		const fetched = { id: '5702c0e5', title: 'Original title', subtitle: 'Kept' };
		const delta = { id: '5702c0e5', title: 'Edited title' };

		expect(applyVersionDelta(fetched, delta)).toEqual({
			id: '5702c0e5',
			title: 'Edited title',
			subtitle: 'Kept',
		});
	});

	test('merges the nested related item of a junction row one level deep and skips display helpers', () => {
		const junctionRow = {
			id: '322b8487',
			collection: 'block_trust_bar',
			item: { id: '5702c0e5', title: 'Original title', subtitle: 'Kept' },
		};

		const delta = {
			id: '322b8487',
			collection: 'block_trust_bar',
			item: { id: '5702c0e5', title: 'Edited title' },
			$type: 'updated',
			$index: 0,
		};

		expect(applyVersionDelta(junctionRow, delta, 'item')).toEqual({
			id: '322b8487',
			collection: 'block_trust_bar',
			item: { id: '5702c0e5', title: 'Edited title', subtitle: 'Kept' },
		});
	});

	test('uses the delta entry alone when the item has no row to fetch', () => {
		const delta = { collection: 'block_trust_bar', item: { title: 'Created in version' } };

		expect(applyVersionDelta(null, delta, 'item')).toEqual(delta);
	});

	test('does not modify the fetched values', () => {
		const fetched = { item: { title: 'Original title' } };

		applyVersionDelta(fetched, { item: { title: 'Edited title' } }, 'item');

		expect(fetched).toEqual({ item: { title: 'Original title' } });
	});
});
