import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import OverlayItemContent from './overlay-item-content.vue';
import OverlayItem from './overlay-item.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@/composables/use-permissions', () => ({
	usePermissions: () => ({
		collectionPermissions: {},
		itemPermissions: {
			fields: computed(() => []),
			saveAllowed: computed(() => true),
		},
	}),
}));

vi.mock('@/composables/use-collab', () => ({
	useCollab: () => ({
		connected: ref(false),
		users: ref([]),
		focused: ref({}),
		connectionId: ref(null),
		collabCollision: ref(undefined),
		collabContext: { focusedFields: [] },
		update: vi.fn(),
		clearCollidingChanges: vi.fn(),
	}),
}));

vi.mock('@directus/composables', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/composables')>()),
	useCollection: () => ({
		info: computed(() => ({ name: 'Page blocks', collection: 'page_blocks', meta: null })),
		primaryKeyField: computed(() => ({ field: 'id' })),
		fields: computed(() => []),
	}),
	useGroupable: () => ({ active: ref(false), toggle: vi.fn() }),
	useSizeClass: () => computed(() => ''),
	useShortcut: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => ({
	...(await importOriginal<typeof import('vue-router')>()),
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/composables/use-edits-guard', () => ({
	useEditsGuard: () => ({ confirmLeave: ref(false), leaveTo: ref(null) }),
}));

vi.mock('@/api', () => ({
	default: { get: mockGet },
	RequestError: class RequestError extends Error {},
}));

const globalStubs: GlobalMountOptions = {
	directives: {
		tooltip: Tooltip,
		'click-outside': ClickOutside,
	},
	stubs: {
		VDialog: { template: '<div><slot /></div>' },
		VDrawer: { template: '<div><slot /></div>' },
		VMenu: { template: '<div><slot /></div>' },
		VCard: { template: '<div><slot /></div>' },
		VCardTitle: { template: '<div><slot /></div>' },
		VCardText: { template: '<div><slot /></div>' },
		VCardActions: { template: '<div><slot /></div>' },
		VButton: { template: '<button><slot /></button>' },
		VIcon: true,
		VSkeletonLoader: true,
		OverlayItemContent: true,
		CollabIndicatorHeader: true,
		ComparisonModal: { template: '<div />' },
		FlowDialogs: true,
		RenderTemplate: true,
		PrivateViewHeaderBarActionButton: true,
	},
};

let global: GlobalMountOptions;

const junctionRow = { id: 'junction-1', collection: 'block_trust_bar', item: '5702c0e5' };
const publishedBlock = { id: '5702c0e5', title: 'Original title' };

beforeEach(() => {
	const pinia = createTestingPinia({ createSpy: vi.fn });

	vi.mocked(useFieldsStore(pinia).getField).mockReturnValue({ field: 'item' } as any);

	vi.mocked(useRelationsStore(pinia).getRelationsForField).mockReturnValue([
		{
			collection: 'page_blocks',
			field: 'item',
			related_collection: null,
			meta: { one_collection_field: 'collection' },
		},
	] as any);

	mockGet.mockImplementation(async (url: string) => {
		if (url.startsWith('/items/page_blocks')) return { data: { data: structuredClone(junctionRow) } };
		return { data: { data: structuredClone(publishedBlock) } };
	});

	global = { ...globalStubs, plugins: [i18n, pinia] };
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('block opened from a content version', () => {
	it('shows the changes saved in the version delta for an existing block', async () => {
		const edits = {
			id: 'junction-1',
			collection: 'block_trust_bar',
			item: { id: '5702c0e5', title: 'Edited title' },
			$type: 'updated',
			$index: 0,
		};

		const wrapper = mount(OverlayItem, {
			props: {
				collection: 'page_blocks',
				active: true,
				primaryKey: 'junction-1',
				relatedPrimaryKey: '5702c0e5',
				junctionField: 'item',
				edits,
				mergeEditsIntoInitialValues: true,
			},
			global,
		});

		await flushPromises();

		const initialValues = wrapper.findComponent(OverlayItemContent).props('initialValues') as Record<string, any>;

		expect(initialValues.item.title).toBe('Edited title');
		expect(initialValues.item.id).toBe('5702c0e5');

		// The staged edits passed in by the parent are not modified while merging
		expect(edits.item).toEqual({ id: '5702c0e5', title: 'Edited title' });
	});

	it('uses the version delta as the form source for a block that only exists in the delta', async () => {
		const wrapper = mount(OverlayItem, {
			props: {
				collection: 'page_blocks',
				active: true,
				primaryKey: '+',
				relatedPrimaryKey: '+',
				junctionField: 'item',
				edits: {
					collection: 'block_trust_bar',
					item: { title: 'Block created in the version' },
					$type: 'created',
					$index: 0,
				},
				mergeEditsIntoInitialValues: true,
			},
			global,
		});

		await flushPromises();

		const initialValues = wrapper.findComponent(OverlayItemContent).props('initialValues') as Record<string, any>;

		expect(initialValues).toEqual({
			collection: 'block_trust_bar',
			item: { title: 'Block created in the version' },
		});
	});

	it('keeps loading the published values when the parent is not a version', async () => {
		const wrapper = mount(OverlayItem, {
			props: {
				collection: 'page_blocks',
				active: true,
				primaryKey: 'junction-1',
				relatedPrimaryKey: '5702c0e5',
				junctionField: 'item',
				edits: { id: 'junction-1', collection: 'block_trust_bar', item: { id: '5702c0e5', title: 'Unsaved title' } },
			},
			global,
		});

		await flushPromises();

		const initialValues = wrapper.findComponent(OverlayItemContent).props('initialValues') as Record<string, any>;

		expect(initialValues.item.title).toBe('Original title');
	});
});
