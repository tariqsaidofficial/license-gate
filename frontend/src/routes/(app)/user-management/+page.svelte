<script lang="ts">
	import { goto } from '$app/navigation'
	import { onDestroy, onMount } from 'svelte'
	import Button from '../../../lib/components/basics/Button.svelte'
	import ResetPasswordModal from '../../../lib/components/admin/ResetPasswordModal.svelte'
	import { logSuccess, logError } from '../../../lib/stores/alerts'
	import { trpc } from '../../../lib/trpcClient'

	// Auto-refresh interval
	let refreshInterval: NodeJS.Timeout;

	// State
	let users: any[] = [];
	let dashboardStats: any = {};
	let loading = true;
	let isRefreshing = false;
	let showCreateModal = false;
	let showEditModal = false;
	let showResetPasswordModal = false;
	let showDeleteModal = false;
	let selectedUser: any = null;

	// Form data
	let createForm = {
		email: '',
		fullName: '',
		company: '',
		isAdmin: false,
		maxLicenses: 10,
		maxApiKeys: 5,
		isActive: true
	};

	let editForm = {
		userID: '',
		fullName: '',
		company: '',
		isAdmin: false,
		maxLicenses: 10,
		maxApiKeys: 5,
		isActive: true
	};

	// Load data
	onMount(async () => {
		// Check admin privileges first
		try {
			const userInfo = await trpc.auth.me.query();
			if (!userInfo.isAdmin) {
				goto('/dashboard');
				return;
			}
		} catch (error) {
			goto('/dashboard');
			return;
		}
		
		await loadData();
		
		// Set up auto-refresh every 30 seconds
		refreshInterval = setInterval(async () => {
			// Only refresh if not in a modal and not manually refreshing
			if (!showCreateModal && !showEditModal && !showResetPasswordModal && !showDeleteModal && !loading && !isRefreshing) {
				console.log('Auto-refreshing data...');
				await loadData(true); // Silent refresh
			}
		}, 30000);
	});

	// Cleanup on component destroy
	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	// Manual refresh
	async function refreshData() {
		isRefreshing = true;
		await loadData();
		isRefreshing = false;
		logSuccess('Data refreshed successfully');
	}

	async function loadData(silent = false) {
		try {
			if (!silent) loading = true;
			
			const [usersData, statsData] = await Promise.all([
				trpc.admin.users.query(),
				trpc.admin.dashboardStats.query()
			]);
			
			users = usersData;
			dashboardStats = statsData;
			
			if (silent) {
				console.log('Data updated silently');
			}
		} catch (error) {
			if (!silent) {
				logError('Failed to load data');
			}
			console.error('Load data error:', error);
		} finally {
			if (!silent) loading = false;
		}
	}

	// Create user
	async function createUser() {
		try {
			const result = await trpc.admin.createUser.mutate(createForm);
			
			// Optimistic update: add user to list immediately
			const newUser = {
				...result,
				currentLicenses: 0,
				currentApiKeys: 0
			};
			users = [newUser, ...users];
			
			// Update stats immediately
			dashboardStats = {
				...dashboardStats,
				totalUsers: dashboardStats.totalUsers + 1,
				activeUsers: result.isActive ? dashboardStats.activeUsers + 1 : dashboardStats.activeUsers
			};
			
			logSuccess(`User created successfully! Temporary password: ${result.temporaryPassword}`);
			closeCreateModal();
			
			// Refresh data in background to sync with server
			setTimeout(() => loadData(true), 1000);
		} catch (error: any) {
			logError(error.message || 'Failed to create user');
		}
	}

	// Update user
	async function updateUser() {
		try {
			const updatedUser = await trpc.admin.updateUser.mutate(editForm);
			
			// Optimistic update: update user in list immediately
			users = users.map(user => 
				user.userID === updatedUser.userID 
					? { ...user, ...updatedUser }
					: user
			);
			
			logSuccess('User updated successfully');
			closeEditModal();
			
			// Refresh data in background to sync with server
			setTimeout(() => loadData(true), 1000);
		} catch (error: any) {
			logError(error.message || 'Failed to update user');
		}
	}

	// Reset password - show modal
	function showResetPasswordDialog(user: any) {
		selectedUser = user;
		showResetPasswordModal = true;
	}

	// Handle password reset success
	function handlePasswordResetSuccess(event: any) {
		const { type, password } = event.detail;
		showResetPasswordModal = false;
		selectedUser = null;
		
		// Refresh data to sync with server
		setTimeout(() => loadData(true), 1000);
	}

	// Close reset password modal
	function closeResetPasswordModal() {
		showResetPasswordModal = false;
		selectedUser = null;
	}

	// Toggle user status
	async function toggleUserStatus(userID: string) {
		try {
			// Find current user for optimistic update
			const currentUser = users.find(u => u.userID === userID);
			if (!currentUser) return;
			
			// Optimistic update: update user status in list immediately
			users = users.map(user => 
				user.userID === userID 
					? { ...user, isActive: !user.isActive }
					: user
			);
			
			// Update stats optimistically
			dashboardStats = {
				...dashboardStats,
				activeUsers: currentUser.isActive 
					? dashboardStats.activeUsers - 1 
					: dashboardStats.activeUsers + 1
			};
			
			// Make API call
			const updatedUser = await trpc.admin.toggleUserStatus.mutate({ userID });
			
			// Sync with server response
			users = users.map(user => 
				user.userID === userID 
					? { ...user, isActive: updatedUser.isActive }
					: user
			);
			
			logSuccess('User status updated successfully');
			
			// Refresh data in background to sync with server
			setTimeout(() => loadData(true), 1000);
		} catch (error: any) {
			// Revert optimistic update on error
			loadData(true);
			logError(error.message || 'Failed to update status');
		}
	}

	// Delete user
	function showDeleteDialog(user: any) {
		selectedUser = user;
		showDeleteModal = true;
	}

	async function confirmDeleteUser() {
		if (!selectedUser) return;
		
		try {
			// Optimistic update: remove user from list immediately
			const userToDelete = selectedUser;
			users = users.filter(user => user.userID !== userToDelete.userID);
			
			// Update stats optimistically
			dashboardStats = {
				...dashboardStats,
				totalUsers: dashboardStats.totalUsers - 1,
				activeUsers: userToDelete.isActive ? dashboardStats.activeUsers - 1 : dashboardStats.activeUsers
			};
			
			// Make API call
			await trpc.admin.deleteUser.mutate({ userID: userToDelete.userID });
			
			logSuccess('User deleted successfully');
			closeDeleteModal();
			
			// Refresh data in background to sync with server
			setTimeout(() => loadData(true), 1000);
		} catch (error: any) {
			// Revert optimistic update on error
			loadData(true);
			logError(error.message || 'Failed to delete user');
			closeDeleteModal();
		}
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		selectedUser = null;
	}

	// Modal functions
	function openCreateModal() {
		createForm = {
			email: '',
			fullName: '',
			company: '',
			isAdmin: false,
			maxLicenses: 10,
			maxApiKeys: 5,
			isActive: true
		};
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	function openEditModal(user: any) {
		selectedUser = user;
		editForm = {
			userID: user.userID,
			fullName: user.fullName || '',
			company: user.company || '',
			isAdmin: user.isAdmin,
			maxLicenses: user.maxLicenses || 10,
			maxApiKeys: user.maxApiKeys || 5,
			isActive: user.isActive
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedUser = null;
	}



	function formatDate(date: string) {
		return new Date(date).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>User Management - LicenseGate</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">User Management</h1>
			<p class="text-gray-600">Manage users, permissions and account limits</p>
		</div>
		<div class="flex gap-2">
			<Button on:click={refreshData} class="bg-gray-600 hover:bg-gray-700" disabled={loading || isRefreshing}>
				<span class="material-icons mr-2 {isRefreshing ? 'animate-spin' : ''}">refresh</span>
				{isRefreshing ? 'Refreshing...' : 'Refresh'}
			</Button>
			<Button on:click={openCreateModal} class="bg-blue-600 hover:bg-blue-700">
				<span class="material-icons mr-2">add</span>
				Create User
			</Button>
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<!-- Dashboard KPIs -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
			<div class="bg-white p-4 rounded-lg shadow border">
				<div class="flex items-center">
					<div class="p-2 bg-blue-100 rounded-lg">
						<span class="material-icons text-blue-600">people</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">Total Users</p>
						<p class="text-2xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-lg shadow border">
				<div class="flex items-center">
					<div class="p-2 bg-green-100 rounded-lg">
						<span class="material-icons text-green-600">check_circle</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">Active Users</p>
						<p class="text-2xl font-bold text-gray-900">{dashboardStats.activeUsers}</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-lg shadow border">
				<div class="flex items-center">
					<div class="p-2 bg-purple-100 rounded-lg">
						<span class="material-icons text-purple-600">key</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">Total Licenses</p>
						<p class="text-2xl font-bold text-gray-900">{dashboardStats.totalLicenses}</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-lg shadow border">
				<div class="flex items-center">
					<div class="p-2 bg-yellow-100 rounded-lg">
						<span class="material-icons text-yellow-600">vpn_key</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">Active Licenses</p>
						<p class="text-2xl font-bold text-gray-900">{dashboardStats.activeLicenses}</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-lg shadow border">
				<div class="flex items-center">
					<div class="p-2 bg-indigo-100 rounded-lg">
						<span class="material-icons text-indigo-600">api</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">API Keys</p>
						<p class="text-2xl font-bold text-gray-900">{dashboardStats.totalApiKeys}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Users Table -->
		<div class="bg-white shadow-sm rounded-lg border">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">Users ({users.length})</h3>
			</div>
			
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Licenses</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Keys</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
							<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each users as user}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="flex-shrink-0 h-8 w-8">
											<div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
												<span class="text-xs font-medium text-gray-700">{user.email.charAt(0).toUpperCase()}</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{user.fullName || user.email}</div>
											<div class="text-sm text-gray-500">{user.email}</div>
											<div class="text-sm text-gray-500 font-mono">{user.userID}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{user.company || '-'}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
										{user.isAdmin ? 'Admin' : 'User'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									<span class="font-medium">{user.currentLicenses}</span>
									<span class="text-gray-500">/ {user.maxLicenses}</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									<span class="font-medium">{user.currentApiKeys}</span>
									<span class="text-gray-500">/ {user.maxApiKeys}</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
										{user.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
									<button 
										on:click={() => openEditModal(user)}
										class="text-blue-600 hover:text-blue-900"
										title="Edit User"
									>
										<span class="material-icons text-sm">edit</span>
									</button>
									<button 
										on:click={() => showResetPasswordDialog(user)}
										class="text-orange-600 hover:text-orange-900"
										title="Reset Password"
									>
										<span class="material-icons text-sm">lock_reset</span>
									</button>
									<button 
										on:click={() => toggleUserStatus(user.userID)}
										class="text-{user.isActive ? 'red' : 'green'}-600 hover:text-{user.isActive ? 'red' : 'green'}-900"
										title="{user.isActive ? 'Deactivate' : 'Activate'} User"
									>
										<span class="material-icons text-sm">{user.isActive ? 'block' : 'check_circle'}</span>
									</button>
									<button 
										on:click={() => showDeleteDialog(user)}
										class="text-red-600 hover:text-red-900"
										title="Delete User"
									>
										<span class="material-icons text-sm">delete</span>
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<!-- Create User Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
			
			<form on:submit|preventDefault={createUser} class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700">Email</label>
					<input 
						type="email" 
						bind:value={createForm.email}
						required
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="user@company.com"
					>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700">Full Name</label>
					<input 
						type="text" 
						bind:value={createForm.fullName}
						required
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="John Doe"
					>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700">Company (Optional)</label>
					<input 
						type="text" 
						bind:value={createForm.company}
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Company name"
					>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700">Max Licenses</label>
						<input 
							type="number" 
							bind:value={createForm.maxLicenses}
							min="0"
							class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700">Max API Keys</label>
						<input 
							type="number" 
							bind:value={createForm.maxApiKeys}
							min="0"
							class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
					</div>
				</div>

				<div class="flex items-center space-x-4">
					<label class="flex items-center">
						<input type="checkbox" bind:checked={createForm.isAdmin} class="mr-2">
						<span class="text-sm text-gray-700">Admin User</span>
					</label>

					<label class="flex items-center">
						<input type="checkbox" bind:checked={createForm.isActive} class="mr-2">
						<span class="text-sm text-gray-700">Active</span>
					</label>
				</div>

				<div class="flex justify-end space-x-3 pt-4">
					<Button type="button" on:click={closeCreateModal} outlined>Cancel</Button>
					<Button type="submit">Create User</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit User Modal -->
{#if showEditModal && selectedUser}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Edit User: {selectedUser.email}</h3>
			
			<form on:submit|preventDefault={updateUser} class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700">Full Name</label>
					<input 
						type="text" 
						bind:value={editForm.fullName}
						required
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="John Doe"
					>
				</div>
				
				<div>
					<label class="block text-sm font-medium text-gray-700">Company</label>
					<input 
						type="text" 
						bind:value={editForm.company}
						class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Company name"
					>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700">Max Licenses</label>
						<input 
							type="number" 
							bind:value={editForm.maxLicenses}
							min="0"
							class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700">Max API Keys</label>
						<input 
							type="number" 
							bind:value={editForm.maxApiKeys}
							min="0"
							class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
					</div>
				</div>

				<div class="flex items-center space-x-4">
					<label class="flex items-center">
						<input type="checkbox" bind:checked={editForm.isAdmin} class="mr-2">
						<span class="text-sm text-gray-700">Admin User</span>
					</label>

					<label class="flex items-center">
						<input type="checkbox" bind:checked={editForm.isActive} class="mr-2">
						<span class="text-sm text-gray-700">Active</span>
					</label>
				</div>

				<div class="flex justify-end space-x-3 pt-4">
					<Button type="button" on:click={closeEditModal} outlined>Cancel</Button>
					<Button type="submit">Update User</Button>
				</div>
			</form>
		</div>
	</div>
{/if}



<!-- Delete User Modal -->
{#if showDeleteModal && selectedUser}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-900">Delete User</h3>
					<button on:click={closeDeleteModal} class="text-gray-400 hover:text-gray-600">
						<span class="material-icons">close</span>
					</button>
				</div>

				<div class="mb-6">
					<div class="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
						<span class="material-icons text-red-600 mr-3">warning</span>
						<div>
							<p class="text-sm font-medium text-red-800">Are you sure?</p>
							<p class="text-sm text-red-700">
								This will permanently delete user <strong>{selectedUser.email}</strong> and all associated data. 
								This action cannot be undone.
							</p>
						</div>
					</div>
				</div>

				<div class="flex justify-end space-x-3">
					<Button type="button" on:click={closeDeleteModal} outlined>Cancel</Button>
					<Button type="button" on:click={confirmDeleteUser} class="bg-red-600 hover:bg-red-700">
						<span class="material-icons mr-2">delete</span>
						Delete User
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Reset Password Modal -->
<ResetPasswordModal 
	bind:show={showResetPasswordModal}
	user={selectedUser}
	on:success={handlePasswordResetSuccess}
	on:close={closeResetPasswordModal}
/>
