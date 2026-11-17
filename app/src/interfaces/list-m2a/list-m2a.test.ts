import type { ContentVersion } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { cloneDeep } from 'lodash-es';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import ListM2A from './list-m2a.vue';
import { i18n } from '@/lang';
import DrawerItem from '@/views/private/components/drawer-item.vue';

const relationMultiple = vi.hoisted(() => ({ getItemEdits: vi.fn((_item: unknown): Record<string, any> => ({})) }));

vi.mock('@/composables/use-relation-m2a', () => ({
	useRelationM2A: () => ({
		relationInfo: computed(() => ({
			type: 'm2a',
			allowedCollections: [{ collection: 'block_trust_bar', meta: { singleton: false } }],
			collectionField: { field: 'collection' },
			junctionField: { field: 'item' },
			junctionPrimaryKeyField: { field: 'id' },
			junctionCollection: { collection: 'page_blocks' },
			reverseJunctionField: { field: 'page_id' },
			relationPrimaryKeyFields: { block_trust_bar: { field: 'id' } },
			sortField: null,
		})),
	}),
}));

vi.mock('@/composables/use-relation-permissions', () => ({
	useRelationPermissionsM2A: () => ({
		createAllowed: computed(() => true),
		selectAllowed: computed(() => true),
		updateAllowed: computed(() => true),
		deleteAllowed: computed(() => true),
	}),
}));

vi.mock('@/composables/use-relation-multiple', () => ({
	useRelationMultiple: () => ({
		create: vi.fn(),
		update: vi.fn(),
		remove: vi.fn(),
		select: vi.fn(),
		displayItems: ref([]),
		totalItemCount: ref(1),
		loading: ref(false),
		selected: ref([]),
		isItemSelected: vi.fn(() => false),
		isLocalItem: vi.fn(() => false),
		getItemEdits: relationMultiple.getItemEdits,
	}),
}));

vi.mock('@/composables/use-page-size', () => ({
	usePageSize: () => ({ sizes: ref([15]), selected: ref(15) }),
}));

vi.mock('@/utils/get-m2a-collection-templates', () => ({ getM2ACollectionTemplates: () => ({}) }));
vi.mock('@/utils/adjust-fields-for-displays', () => ({ adjustFieldsForDisplays: (fields: string[]) => fields }));
vi.mock('@/utils/collection-status', () => ({ isCollectionInactive: () => false }));

const version = { id: 'version-1', key: 'draft' } as ContentVersion;

// What the parent holds for the field after the version was saved and the page was reloaded: only the delta
const savedDelta = {
	create: [{ collection: 'block_trust_bar', item: { title: 'Created in version' } }],
	update: [{ id: 322, collection: 'block_trust_bar', item: { id: 'block-1', title: 'Edited title' } }],
	delete: [],
};

// The block the list shows, which comes from the published rows
const publishedBlock = {
	id: 322,
	collection: 'block_trust_bar',
	item: { id: 'block-1', title: 'Original title', subtitle: 'Original subtitle' },
};

function mountList(props: { version: ContentVersion | null; value?: unknown }) {
	return mount(ListM2A, {
		props: { primaryKey: '1', collection: 'pages', field: 'blocks', value: savedDelta, ...props } as any,
		shallow: true,
		global: { plugins: [i18n, createTestingPinia({ createSpy: vi.fn })] },
	});
}

async function openBlock(wrapper: ReturnType<typeof mountList>, item: Record<string, any>) {
	(wrapper.vm as any).editItem(item);
	await nextTick();

	return wrapper.findComponent(DrawerItem);
}

describe('list-m2a drawer', () => {
	beforeEach(() => {
		relationMultiple.getItemEdits.mockReset();
		relationMultiple.getItemEdits.mockReturnValue({});
	});

	it('opens a block in a version with the values saved in the version', async () => {
		const wrapper = mountList({ version });
		const drawer = await openBlock(wrapper, publishedBlock);

		expect(drawer.props('edits')).toMatchObject({ collection: 'block_trust_bar', item: { title: 'Edited title' } });
		expect(drawer.props('primaryKey')).toBe(322);
		expect(drawer.props('relatedPrimaryKey')).toBe('block-1');
	});

	it('only passes the saved fields on, so unchanged fields are not staged again', async () => {
		const wrapper = mountList({ version });
		const drawer = await openBlock(wrapper, publishedBlock);

		expect(drawer.props('edits')['item']).toEqual({ id: 'block-1', title: 'Edited title' });
	});

	it('opens a block that only exists in the version with its saved values and no row to load', async () => {
		const createdBlock = { collection: 'block_trust_bar', item: {}, $type: 'created', $index: 0 };

		const wrapper = mountList({ version });
		const drawer = await openBlock(wrapper, createdBlock);

		expect(drawer.props('edits')['item']).toEqual({ title: 'Created in version' });
		expect(drawer.props('edits')['collection']).toBe('block_trust_bar');
		expect(drawer.props('primaryKey')).toBe('+');
		expect(drawer.props('relatedPrimaryKey')).toBe('+');
	});

	it('lets edits of the current session win over the saved values', async () => {
		relationMultiple.getItemEdits.mockReturnValue({
			id: 322,
			item: { id: 'block-1', title: 'Typed just now' },
			$type: 'updated',
			$index: 0,
		});

		const wrapper = mountList({ version });
		const drawer = await openBlock(wrapper, publishedBlock);

		expect(drawer.props('edits')['item']['title']).toBe('Typed just now');
	});

	it('does not change the published block or the delta', async () => {
		const block = cloneDeep(publishedBlock);
		const delta = cloneDeep(savedDelta);

		const wrapper = mountList({ version, value: delta });
		const drawer = await openBlock(wrapper, block);

		drawer.props('edits')['item']['title'] = 'changed afterwards';

		expect(block).toEqual(publishedBlock);
		expect(delta).toEqual(savedDelta);
	});

	it('does not use the delta outside of a version', async () => {
		const wrapper = mountList({ version: null });
		const drawer = await openBlock(wrapper, publishedBlock);

		expect(drawer.props('edits')).toEqual({ collection: 'block_trust_bar' });
		expect(drawer.props('primaryKey')).toBe(322);
		expect(drawer.props('relatedPrimaryKey')).toBe('block-1');
	});
});
